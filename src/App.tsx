import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DailyActivityReport,
  DailyChecklistReport,
  TeamMember,
  ClientUser
} from './types';
import {
  createDefaultActivityReport,
  createDefaultChecklistReport,
  createChecklistFromPrevious,
  isChecklistCustomModified,
  isActivityCustomModified
} from './data/defaults';
import {
  loadTeamMembers,
  saveTeamMembersToStorage,
  getTeamMembersLocalUpdatedAt,
  loadClientUsers,
  saveClientUsersToStorage,
  getClientUsersLocalUpdatedAt
} from './data/teamMembers';
import {
  getCustomLogo,
  saveCustomLogo,
  removeCustomLogo
} from './utils/logoStorage';
import {
  saveActivityReport,
  saveActivityReportLocalImmediate,
  loadActivityReport,
  saveChecklistReport,
  saveChecklistReportLocalImmediate,
  loadChecklistReport,
  loadPreviousChecklistReport,
  runAutoCleanupExpiredRecords,
  checkFirestoreConnection,
  saveAppLogoToCloud,
  loadAppLogoFromCloud,
  saveTeamMembersToCloud,
  loadTeamMembersFromCloud,
  saveClientUsersToCloud,
  loadClientUsersFromCloud,
  subscribeToActivityReport,
  subscribeToChecklistReport,
  subscribeToTeamMembers,
  subscribeToClientUsers,
  subscribeToAppLogo,
  syncPendingLocalReportsToCloud,
  DbConnectionResult
} from './services/firebase';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { exportElementsToA4Pdf, triggerNativePrint } from './utils/pdfExport';
import { formatReportDate, getTodayDateString } from './utils/imageUtils';
import { Navbar } from './components/Navbar';
import { DailyActivityForm } from './components/DailyActivityForm';
import { DailyActivityPrintView } from './components/DailyActivityPrintView';
import { DailyChecklistForm } from './components/DailyChecklistForm';
import { DailyChecklistPrintView } from './components/DailyChecklistPrintView';
import { WaReportView } from './components/WaReportView';
import { HistoryModal } from './components/HistoryModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { UserManagementModal } from './components/UserManagementModal';
import { LogoManagerModal } from './components/LogoManagerModal';
import { QuotaMonitorModal } from './components/QuotaMonitorModal';
import {
  Download,
  CheckCircle,
  AlertCircle,
  Wifi,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'activity' | 'checklist' | 'wareport'>('activity');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Custom Logo state (cached locally and synced with Cloud Firestore)
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => getCustomLogo());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);

  // Team members (IT PICs)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadTeamMembers());
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);

  // Client Users (Hotel Users / Clients & Departments - separate from IT PICs)
  const [clientUsers, setClientUsers] = useState<ClientUser[]>(() => loadClientUsers());
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  // Reports
  const [activityReport, setActivityReport] = useState<DailyActivityReport>(() =>
    createDefaultActivityReport(getTodayDateString())
  );
  const [checklistReport, setChecklistReport] = useState<DailyChecklistReport>(() =>
    createDefaultChecklistReport(getTodayDateString())
  );

  const [isDbOnline, setIsDbOnline] = useState<boolean>(true);
  const [dbConnectionResult, setDbConnectionResult] = useState<DbConnectionResult | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState<boolean>(false);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusText, setSaveStatusText] = useState<string>('✓ Tersimpan otomatis ke Cloud');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ progress: number; text: string } | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // References for PDF rendering (mounted in always-visible off-screen portal)
  const actPage1Ref = useRef<HTMLDivElement | null>(null);
  const actPage2Ref = useRef<HTMLDivElement | null>(null);
  const checklistPageRef = useRef<HTMLDivElement | null>(null);

  // Auto-save refs to track saved state and debounce keystrokes
  const lastSavedActRef = useRef<string>('');
  const lastSavedCheckRef = useRef<string>('');
  const isDateLoadedRef = useRef<string>('');
  const actDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest reports in refs for instant flush on date switch
  const latestActRef = useRef<DailyActivityReport>(activityReport);
  latestActRef.current = activityReport;
  const latestCheckRef = useRef<DailyChecklistReport>(checklistReport);
  latestCheckRef.current = checklistReport;

  // Test Firebase connection
  const handleCheckDbConnection = useCallback(async (isSilent = false) => {
    setIsCheckingDb(true);
    try {
      const res = await checkFirestoreConnection();
      setIsDbOnline(res.isOnline);
      setDbConnectionResult(res);
      if (!isSilent) {
        setNotification(res.message);
        setTimeout(() => setNotification(null), 3500);
      }
    } finally {
      setIsCheckingDb(false);
    }
  }, []);

  // Update team members and save to local storage (with cascading report updates on current date only; past dates remain unchanged unless edited)
  const handleUpdateTeamMembers = (
    updated: TeamMember[],
    nameChange?: { oldName: string; newName: string },
    deletedName?: string
  ) => {
    const now = Date.now();
    setTeamMembers(updated);
    saveTeamMembersToStorage(updated, now);
    saveTeamMembersToCloud(updated, now);

    if (deletedName) {
      const activeRemaining = updated.filter((m) => m.isActive);
      const fallbackPic = activeRemaining[0]?.name || '';

      // Update ONLY the currently active date's Activity report (past dates < selectedDate are untouched)
      setActivityReport((prev) => {
        let changed = false;
        const newActs = prev.logBookActivities.map((act) => {
          if (act.pic.trim().toLowerCase() === deletedName.trim().toLowerCase()) {
            changed = true;
            return { ...act, pic: fallbackPic };
          }
          return act;
        });
        if (changed) {
          const updatedRep = {
            ...prev,
            logBookActivities: newActs,
            updatedAt: Date.now(),
          };
          latestActRef.current = updatedRep;
          saveActivityReportLocalImmediate(updatedRep);
          saveActivityReport(updatedRep).catch(console.error);
          return updatedRep;
        }
        return prev;
      });

      // Update ONLY the currently active date's Checklist report (past dates < selectedDate are untouched)
      setChecklistReport((prev) => {
        let changed = false;
        let newMorning = prev.morningShiftPic;
        let newEvening = prev.eveningShiftPic;
        if (prev.morningShiftPic.trim().toLowerCase() === deletedName.trim().toLowerCase()) {
          newMorning = '';
          changed = true;
        }
        if (prev.eveningShiftPic.trim().toLowerCase() === deletedName.trim().toLowerCase()) {
          newEvening = '';
          changed = true;
        }
        const newItems = prev.items.map((it) => {
          if (it.personIncharge.trim().toLowerCase() === deletedName.trim().toLowerCase()) {
            changed = true;
            return { ...it, personIncharge: '' };
          }
          return it;
        });
        if (changed) {
          const updatedCheck = {
            ...prev,
            morningShiftPic: newMorning,
            eveningShiftPic: newEvening,
            items: newItems,
            isUserModified: true,
            updatedAt: Date.now(),
          };
          latestCheckRef.current = updatedCheck;
          saveChecklistReportLocalImmediate(updatedCheck);
          saveChecklistReport(updatedCheck).catch(console.error);
          return updatedCheck;
        }
        return prev;
      });

      setNotification(
        `Petugas "${deletedName}" dihapus pada tanggal ini (${selectedDate}). Data tanggal sebelumnya tidak berubah.`
      );
      setTimeout(() => setNotification(null), 4000);
    }

    if (nameChange) {
      const { oldName, newName } = nameChange;

      // Cascade to active Daily Activity report (current selectedDate only)
      setActivityReport((prev) => {
        let changed = false;
        let newPrep = prev.prepared;
        if (prev.prepared.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          newPrep = newName;
          changed = true;
        }
        const newActs = prev.logBookActivities.map((act) => {
          if (act.pic.trim().toLowerCase() === oldName.trim().toLowerCase()) {
            changed = true;
            return { ...act, pic: newName };
          }
          return act;
        });
        if (changed) {
          const updatedRep = {
            ...prev,
            prepared: newPrep,
            logBookActivities: newActs,
            updatedAt: Date.now(),
          };
          latestActRef.current = updatedRep;
          saveActivityReportLocalImmediate(updatedRep);
          saveActivityReport(updatedRep).catch(console.error);
          return updatedRep;
        }
        return prev;
      });

      // Cascade to active Daily Checklist report (current selectedDate only)
      setChecklistReport((prev) => {
        let changed = false;
        let newMorning = prev.morningShiftPic;
        let newEvening = prev.eveningShiftPic;
        if (prev.morningShiftPic.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          newMorning = newName;
          changed = true;
        }
        if (prev.eveningShiftPic.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          newEvening = newName;
          changed = true;
        }
        const newItems = prev.items.map((it) => {
          if (it.personIncharge.trim().toLowerCase() === oldName.trim().toLowerCase()) {
            changed = true;
            return { ...it, personIncharge: newName };
          }
          return it;
        });
        if (changed) {
          const updatedCheck = {
            ...prev,
            morningShiftPic: newMorning,
            eveningShiftPic: newEvening,
            items: newItems,
            isUserModified: true,
            updatedAt: Date.now(),
          };
          latestCheckRef.current = updatedCheck;
          saveChecklistReportLocalImmediate(updatedCheck);
          saveChecklistReport(updatedCheck).catch(console.error);
          return updatedCheck;
        }
        return prev;
      });

      setNotification(`Data petugas "${oldName}" diperbarui menjadi "${newName}"`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Update client users and save to local storage & cloud (past dates remain unchanged unless edited)
  const handleUpdateClientUsers = (
    updated: ClientUser[],
    userChange?: { oldName: string; newName: string; newDepartment: string },
    deletedUserName?: string
  ) => {
    const now = Date.now();
    setClientUsers(updated);
    saveClientUsersToStorage(updated, now);
    saveClientUsersToCloud(updated, now);

    if (deletedUserName) {
      // Update ONLY the currently active date's Activity report (past dates < selectedDate are untouched)
      setActivityReport((prev) => {
        let changed = false;
        const newActs = prev.logBookActivities.map((act) => {
          if ((act.clientName || '').trim().toLowerCase() === deletedUserName.trim().toLowerCase()) {
            changed = true;
            const dept = act.clientDepartment || 'FO (Front Office)';
            return {
              ...act,
              clientName: '',
              userClient: dept,
            };
          }
          return act;
        });
        if (changed) {
          const updatedRep = {
            ...prev,
            logBookActivities: newActs,
            updatedAt: Date.now(),
          };
          latestActRef.current = updatedRep;
          saveActivityReportLocalImmediate(updatedRep);
          saveActivityReport(updatedRep).catch(console.error);
          return updatedRep;
        }
        return prev;
      });

      setNotification(
        `User/Client "${deletedUserName}" dihapus pada tanggal ini (${selectedDate}). Data tanggal sebelumnya tidak berubah.`
      );
      setTimeout(() => setNotification(null), 4000);
    }

    if (userChange) {
      const { oldName, newName, newDepartment } = userChange;
      setActivityReport((prev) => {
        let changed = false;
        const newActs = prev.logBookActivities.map((act) => {
          if ((act.clientName || '').trim().toLowerCase() === oldName.trim().toLowerCase()) {
            changed = true;
            const userClientStr = newName.trim()
              ? `${newName.trim()} (${newDepartment})`
              : newDepartment;
            return {
              ...act,
              clientName: newName,
              clientDepartment: newDepartment,
              userClient: userClientStr,
            };
          }
          return act;
        });
        if (changed) {
          const updatedRep = {
            ...prev,
            logBookActivities: newActs,
            updatedAt: Date.now(),
          };
          latestActRef.current = updatedRep;
          saveActivityReportLocalImmediate(updatedRep);
          saveActivityReport(updatedRep).catch(console.error);
          return updatedRep;
        }
        return prev;
      });

      setNotification(`Data User/Client "${oldName}" diperbarui menjadi "${newName}"`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Wrapper for Daily Activity edits: marks as user-modified, updates state, ref, and immediate local storage
  const handleActivityChange = useCallback((updated: DailyActivityReport) => {
    const nextReport: DailyActivityReport = {
      ...updated,
      isUserModified: true,
      updatedAt: Date.now(),
    };
    latestActRef.current = nextReport;
    saveActivityReportLocalImmediate(nextReport);
    setActivityReport(nextReport);
  }, []);

  // Wrapper for Daily Checklist edits: marks as user-modified, updates state, ref, and immediate local storage (plus two-way sync with Activity & WA Report)
  const handleChecklistChange = useCallback((updated: DailyChecklistReport) => {
    const item1 = updated.items.find((it) => it.no === 1 || it.taskList.toLowerCase().includes('unifi'));
    const nextReport: DailyChecklistReport = {
      ...updated,
      waReportPhotoCaption: item1 ? item1.remark : updated.waReportPhotoCaption,
      isUserModified: true,
      updatedAt: Date.now(),
    };
    latestCheckRef.current = nextReport;
    saveChecklistReportLocalImmediate(nextReport);
    setChecklistReport(nextReport);

    // Two-way sync: if Task #2 (Bandwidth statistic) remark has MAX/AVG/CURRENT values, sync back to Daily Activity Internet Traffic
    const item2 = updated.items.find((it) => it.no === 2 || it.taskList.toLowerCase().includes('bandwidth'));
    if (item2?.remark && item2.remark !== '-') {
      const mMatch = item2.remark.match(/MAX:\s*([^\s|]+)/i);
      const aMatch = item2.remark.match(/AVG:\s*([^\s|]+)/i);
      const cMatch = item2.remark.match(/(?:CURRENT|CR):\s*([^\s|]+)/i);
      if (mMatch || aMatch || cMatch) {
        const cleanNum = (v?: string) => (!v || v === '-' ? '' : v.replace(/mbps/gi, '').trim());
        const newMax = mMatch ? cleanNum(mMatch[1]) : latestActRef.current.internetTraffic.maxIn || '';
        const newAvg = aMatch ? cleanNum(aMatch[1]) : latestActRef.current.internetTraffic.avgIn || '';
        const newCur = cMatch ? cleanNum(cMatch[1]) : latestActRef.current.internetTraffic.currentIn || '';

        const curTraffic = latestActRef.current.internetTraffic;
        if (
          newMax !== (curTraffic.maxIn || '') ||
          newAvg !== (curTraffic.avgIn || '') ||
          newCur !== (curTraffic.currentIn || '')
        ) {
          const nextAct: DailyActivityReport = {
            ...latestActRef.current,
            internetTraffic: {
              ...curTraffic,
              maxIn: newMax,
              avgIn: newAvg,
              currentIn: newCur,
            },
            isUserModified: true,
            updatedAt: Date.now(),
          };
          latestActRef.current = nextAct;
          saveActivityReportLocalImmediate(nextAct);
          setActivityReport(nextAct);
        }
      }
    }
  }, []);

  // Explicitly re-sync current date's checklist from previous date
  const handleSyncFromPreviousDate = useCallback(async () => {
    setIsSaving(true);
    try {
      const prevCheck = await loadPreviousChecklistReport(selectedDate);
      if (prevCheck) {
        const inherited = createChecklistFromPrevious(selectedDate, prevCheck);
        latestCheckRef.current = inherited;
        saveChecklistReportLocalImmediate(inherited);
        setChecklistReport(inherited);
        const res = await saveChecklistReport(inherited);
        lastSavedCheckRef.current = JSON.stringify(inherited);
        setIsDbOnline(!res.isLocalFallback);
        setSaveStatusText(
          res.isLocalFallback
            ? '✓ Tersimpan di Cadangan Lokal (Offline)'
            : '✓ Tersimpan otomatis ke Cloud'
        );
        setNotification(
          `✓ Checklist tanggal ${selectedDate} mengikuti tanggal sebelumnya (${prevCheck.date})`
        );
      } else {
        setNotification('Belum ada data checklist pada tanggal sebelumnya.');
      }
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to sync from previous date:', err);
    } finally {
      setIsSaving(false);
    }
  }, [selectedDate]);

  // Auto-save immediately to Firestore & Local Storage when image is uploaded or modified
  const handleAutoSaveActivity = useCallback(async (updated: DailyActivityReport) => {
    if (actDebounceTimerRef.current) {
      clearTimeout(actDebounceTimerRef.current);
      actDebounceTimerRef.current = null;
    }

    setIsSaving(true);
    setSaveStatusText('Menyimpan foto ke database...');
    try {
      const nextReport: DailyActivityReport = {
        ...updated,
        isUserModified: true,
        updatedAt: Date.now(),
      };
      latestActRef.current = nextReport;
      setActivityReport(nextReport);
      saveActivityReportLocalImmediate(nextReport);
      const nextJson = JSON.stringify(nextReport);
      lastSavedActRef.current = nextJson;

      const res = await saveActivityReport(nextReport);
      setSaveStatusText(
        res.isLocalFallback
          ? '✓ Foto Tersimpan di Cadangan Lokal (Offline)'
          : '✓ Foto Tersimpan Otomatis di Firestore'
      );
      setIsDbOnline(!res.isLocalFallback);
      setNotification('✓ Gambar baru berhasil disimpan otomatis ke Database!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Auto save image failed:', err);
      setSaveStatusText('Gagal menyimpan foto');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Save/Update logo handler with Cloud & Local storage sync
  const handleSaveLogo = (newLogoUrl: string | null) => {
    if (newLogoUrl) {
      saveCustomLogo(newLogoUrl);
      saveAppLogoToCloud(newLogoUrl);
      setCustomLogoUrl(newLogoUrl);
      setNotification('Logo kustom berhasil diterapkan di form, preview, dan cetak PDF.');
    } else {
      removeCustomLogo();
      saveAppLogoToCloud(null);
      setCustomLogoUrl(null);
      setNotification('Logo dikembalikan ke default Hotel Ciputra Jakarta.');
    }
    setTimeout(() => setNotification(null), 3500);
  };

  // Run connection check, load cloud logo, real-time sync, and auto-cleanup on mount
  useEffect(() => {
    handleCheckDbConnection();
    syncPendingLocalReportsToCloud();

    // Initial check if cloud has a synced logo
    loadAppLogoFromCloud().then((cloudLogo) => {
      if (cloudLogo) {
        setCustomLogoUrl(cloudLogo);
        saveCustomLogo(cloudLogo);
      }
    });

    // Real-time listener for app logo
    const unsubLogo = subscribeToAppLogo((cloudLogo) => {
      setCustomLogoUrl(cloudLogo);
      if (cloudLogo) {
        saveCustomLogo(cloudLogo);
      } else {
        removeCustomLogo();
      }
    });

    // Initial check if cloud has synced team members (only apply if newer than local changes)
    loadTeamMembersFromCloud().then((cloudData) => {
      if (cloudData) {
        const localUpdated = getTeamMembersLocalUpdatedAt();
        if (cloudData.updatedAt > localUpdated) {
          setTeamMembers(cloudData.members);
          saveTeamMembersToStorage(cloudData.members, cloudData.updatedAt);
        }
      }
    });

    // Real-time listener for team members
    const unsubTeam = subscribeToTeamMembers((members, updatedAt) => {
      const localUpdated = getTeamMembersLocalUpdatedAt();
      if (updatedAt > localUpdated) {
        setTeamMembers(members);
        saveTeamMembersToStorage(members, updatedAt);
      }
    });

    // Initial check if cloud has synced client users (only apply if newer than local changes)
    loadClientUsersFromCloud().then((cloudData) => {
      if (cloudData) {
        const localUpdated = getClientUsersLocalUpdatedAt();
        if (cloudData.updatedAt > localUpdated) {
          setClientUsers(cloudData.users);
          saveClientUsersToStorage(cloudData.users, cloudData.updatedAt);
        }
      }
    });

    // Real-time listener for client users
    const unsubClients = subscribeToClientUsers((users, updatedAt) => {
      const localUpdated = getClientUsersLocalUpdatedAt();
      if (updatedAt > localUpdated) {
        setClientUsers(users);
        saveClientUsersToStorage(users, updatedAt);
      }
    });

    runAutoCleanupExpiredRecords().then((res) => {
      const total = res.deletedActivities + res.deletedChecklists;
      if (total > 0) {
        setNotification(
          `Auto-cleanup storage: ${total} data lama (>2 bulan) berhasil dibersihkan otomatis.`
        );
      }
    });

    return () => {
      unsubLogo();
      unsubTeam();
      unsubClients();
    };
  }, [handleCheckDbConnection]);

  // Flush any pending unsaved debounced edits immediately (e.g. before date switch or unmount)
  const flushPendingSaves = useCallback(async () => {
    if (actDebounceTimerRef.current) {
      clearTimeout(actDebounceTimerRef.current);
      actDebounceTimerRef.current = null;
    }
    if (checkDebounceTimerRef.current) {
      clearTimeout(checkDebounceTimerRef.current);
      checkDebounceTimerRef.current = null;
    }

    const currentAct = latestActRef.current;
    const currentCheck = latestCheckRef.current;
    const actJson = JSON.stringify(currentAct);
    const checkJson = JSON.stringify(currentCheck);

    const actChanged = lastSavedActRef.current !== '' && actJson !== lastSavedActRef.current;
    const checkChanged = lastSavedCheckRef.current !== '' && checkJson !== lastSavedCheckRef.current;

    if (actChanged || checkChanged) {
      setIsSaving(true);
      try {
        if (actChanged) {
          saveActivityReportLocalImmediate(currentAct);
          await saveActivityReport(currentAct);
          lastSavedActRef.current = actJson;
        }
        if (checkChanged) {
          saveChecklistReportLocalImmediate(currentCheck);
          await saveChecklistReport(currentCheck);
          lastSavedCheckRef.current = checkJson;
        }
        setSaveStatusText('✓ Tersimpan otomatis ke Cloud');
      } catch (err) {
        console.warn('Flush save warning:', err);
      } finally {
        setIsSaving(false);
      }
    }
  }, []);

  // Ensure any edits or uploaded images are flushed if user switches tabs or closes/reloads window
  useEffect(() => {
    const handleVisibilityOrUnload = () => {
      if (isDateLoadedRef.current === selectedDate) {
        const currentAct = latestActRef.current;
        const currentCheck = latestCheckRef.current;
        if (currentAct && currentAct.date === selectedDate && isActivityCustomModified(currentAct)) {
          saveActivityReportLocalImmediate(currentAct);
          saveActivityReport(currentAct).catch(() => {});
        }
        if (currentCheck && currentCheck.date === selectedDate && isChecklistCustomModified(currentCheck)) {
          saveChecklistReportLocalImmediate(currentCheck);
          saveChecklistReport(currentCheck).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleVisibilityOrUnload);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleVisibilityOrUnload();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleVisibilityOrUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [selectedDate]);

  // Safe Date Selector: flushes pending changes on current date before loading target date
  const handleSelectDate = useCallback(
    async (newDate: string) => {
      if (!newDate || newDate === selectedDate) return;
      await flushPendingSaves();
      setSelectedDate(newDate);
    },
    [selectedDate, flushPendingSaves]
  );

  // When selectedDate changes, load existing archive or initialize blank activity & inherited checklist
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      // Clear any pending timers
      if (actDebounceTimerRef.current) {
        clearTimeout(actDebounceTimerRef.current);
        actDebounceTimerRef.current = null;
      }
      if (checkDebounceTimerRef.current) {
        clearTimeout(checkDebounceTimerRef.current);
        checkDebounceTimerRef.current = null;
      }

      setIsSaving(true);
      setSaveStatusText('Memuat laporan...');

      try {
        const [loadedAct, loadedCheck, prevCheck] = await Promise.all([
          loadActivityReport(selectedDate),
          loadChecklistReport(selectedDate),
          loadPreviousChecklistReport(selectedDate),
        ]);

        if (isCancelled) return;

        // 1. Daily Activity Report: starts blank (3 empty items) if not yet saved for selectedDate
        let finalAct: DailyActivityReport;
        let shouldSnapshotActivity = false;
        if (loadedAct) {
          const isMockSample =
            loadedAct.logBookActivities.length === 4 &&
            loadedAct.logBookActivities[0]?.details === 'Speedtest at dian ballroom';
          if (isMockSample) {
            finalAct = createDefaultActivityReport(selectedDate);
            shouldSnapshotActivity = true;
          } else {
            finalAct = loadedAct;
          }
        } else {
          finalAct = createDefaultActivityReport(selectedDate);
          shouldSnapshotActivity = true;
        }

        // 2. Daily Checklist Report:
        // Past dates (< today) that already have a saved report ALWAYS preserve their historical snapshot unless edited.
        let finalCheck: DailyChecklistReport;
        let shouldAutoSaveChecklist = false;
        const isPastDate = selectedDate < getTodayDateString();

        const isExplicitlyEditedOnThisDate =
          loadedCheck &&
          (isPastDate ||
            loadedCheck.isUserModified === true ||
            (loadedCheck.isUserModified === undefined &&
              isChecklistCustomModified(loadedCheck) &&
              (!prevCheck || (loadedCheck.updatedAt || 0) >= (prevCheck.updatedAt || 0))));

        if (isExplicitlyEditedOnThisDate && loadedCheck) {
          finalCheck = loadedCheck;
        } else if (prevCheck) {
          finalCheck = createChecklistFromPrevious(selectedDate, prevCheck);
          shouldAutoSaveChecklist = true;
        } else if (loadedCheck) {
          finalCheck = loadedCheck;
        } else {
          finalCheck = createDefaultChecklistReport(selectedDate);
          shouldAutoSaveChecklist = true;
        }

        // 3. Ensure cross-tab synchronization between Activity Traffic (IN) and Checklist Item #2 on load
        const cleanNum = (v?: string) => (!v || v === '-' ? '' : v.replace(/mbps/gi, '').trim());
        const actMax = cleanNum(finalAct.internetTraffic?.maxIn);
        const actAvg = cleanNum(finalAct.internetTraffic?.avgIn);
        const actCur = cleanNum(finalAct.internetTraffic?.currentIn);
        const bwIdx = finalCheck.items.findIndex(
          (it) => it.no === 2 || it.taskList.toLowerCase().includes('bandwidth')
        );

        if (actMax || actAvg || actCur) {
          const syncedRemark = `MAX: ${actMax || '-'} Mbps | AVG: ${actAvg || '-'} Mbps | CURRENT: ${actCur || '-'} Mbps`;
          if (bwIdx !== -1 && finalCheck.items[bwIdx].remark !== syncedRemark) {
            const newItems = [...finalCheck.items];
            newItems[bwIdx] = { ...newItems[bwIdx], remark: syncedRemark };
            finalCheck = { ...finalCheck, items: newItems };
          }
        } else if (isExplicitlyEditedOnThisDate && bwIdx !== -1) {
          const bwRemark = finalCheck.items[bwIdx].remark || '';
          const mMatch = bwRemark.match(/MAX:\s*([^\s|]+)/i);
          const aMatch = bwRemark.match(/AVG:\s*([^\s|]+)/i);
          const cMatch = bwRemark.match(/(?:CURRENT|CR):\s*([^\s|]+)/i);
          if (mMatch || aMatch || cMatch) {
            finalAct = {
              ...finalAct,
              internetTraffic: {
                ...finalAct.internetTraffic,
                maxIn: mMatch ? cleanNum(mMatch[1]) : '',
                avgIn: aMatch ? cleanNum(aMatch[1]) : '',
                currentIn: cMatch ? cleanNum(cMatch[1]) : '',
              },
            };
          }
        }

        // Ensure Task #1 remark and waReportPhotoCaption are synchronized
        const item1 = finalCheck.items.find(
          (it) => it.no === 1 || it.taskList.toLowerCase().includes('unifi')
        );
        if (item1 && finalCheck.waReportPhotoCaption !== item1.remark) {
          finalCheck = {
            ...finalCheck,
            waReportPhotoCaption: item1.remark,
          };
        }

        // Lock in references before state update
        const actStr = JSON.stringify(finalAct);
        const checkStr = JSON.stringify(finalCheck);
        lastSavedActRef.current = actStr;
        lastSavedCheckRef.current = checkStr;
        latestActRef.current = finalAct;
        latestCheckRef.current = finalCheck;
        isDateLoadedRef.current = selectedDate;

        setActivityReport(finalAct);
        setChecklistReport(finalCheck);

        // Snapshot initial activity report in localStorage (with updatedAt: 0 so it never overrides cloud data)
        if (shouldSnapshotActivity) {
          saveActivityReportLocalImmediate(finalAct);
        }

        // Auto-save inherited checklist so the date is persisted immediately
        if (shouldAutoSaveChecklist) {
          saveChecklistReportLocalImmediate(finalCheck);
          const saveRes = await saveChecklistReport(finalCheck);
          if (!isCancelled) {
            setIsDbOnline(!saveRes.isLocalFallback);
            setSaveStatusText(
              saveRes.isLocalFallback
                ? '✓ Tersimpan di Cadangan Lokal (Offline)'
                : '✓ Tersimpan otomatis ke Cloud'
            );
          }
        } else {
          setSaveStatusText('✓ Tersimpan otomatis ke Cloud');
        }

        if (!isCancelled) {
          if (isExplicitlyEditedOnThisDate || (loadedAct && isActivityCustomModified(loadedAct))) {
            setNotification(`Arsip laporan tanggal ${selectedDate} dimuat`);
          } else if (prevCheck) {
            setNotification(
              `Tanggal ${selectedDate}: Checklist mengikuti default tanggal sebelumnya (${prevCheck.items.length} Task)`
            );
          } else {
            setNotification(`Lembar kerja tanggal ${selectedDate} siap digunakan`);
          }
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (err) {
        console.error('Error loading report data:', err);
        setSaveStatusText('Mode Offline');
      } finally {
        if (!isCancelled) {
          setIsSaving(false);
        }
      }
    }

    loadData();

    // Subscribe to real-time changes on Firestore for the active date (multi-user / multi-device synchronization)
    const unsubActivity = subscribeToActivityReport(selectedDate, (remoteAct) => {
      if (isCancelled) return;
      if (remoteAct.date !== selectedDate) return;
      // Do not interrupt user while actively typing
      if (actDebounceTimerRef.current) return;
      const localUpdated = latestActRef.current.updatedAt || 0;
      const remoteUpdated = remoteAct.updatedAt || 0;
      const isRemoteModified = isActivityCustomModified(remoteAct);
      const isLocalModified = isActivityCustomModified(latestActRef.current);
      if ((isRemoteModified && !isLocalModified) || remoteUpdated > localUpdated) {
        latestActRef.current = remoteAct;
        lastSavedActRef.current = JSON.stringify(remoteAct);
        saveActivityReportLocalImmediate(remoteAct);
        setActivityReport(remoteAct);
        setIsDbOnline(true);
      }
    });

    const unsubChecklist = subscribeToChecklistReport(selectedDate, (remoteCheck) => {
      if (isCancelled) return;
      if (remoteCheck.date !== selectedDate) return;
      // Do not interrupt user while actively typing
      if (checkDebounceTimerRef.current) return;
      const localUpdated = latestCheckRef.current.updatedAt || 0;
      const remoteUpdated = remoteCheck.updatedAt || 0;
      const isRemoteModified = isChecklistCustomModified(remoteCheck);
      const isLocalModified = isChecklistCustomModified(latestCheckRef.current);
      if ((isRemoteModified && !isLocalModified) || remoteUpdated > localUpdated) {
        latestCheckRef.current = remoteCheck;
        lastSavedCheckRef.current = JSON.stringify(remoteCheck);
        saveChecklistReportLocalImmediate(remoteCheck);
        setChecklistReport(remoteCheck);
        setIsDbOnline(true);
      }
    });

    return () => {
      isCancelled = true;
      unsubActivity();
      unsubChecklist();
    };
  }, [selectedDate]);

  // Debounced Auto-Save on EVERY text change in Activity Report (No save button needed)
  useEffect(() => {
    if (isDateLoadedRef.current !== selectedDate) return;
    if (activityReport.date !== selectedDate) return;

    const currentJson = JSON.stringify(activityReport);
    if (currentJson === lastSavedActRef.current) return;

    setSaveStatusText('Menyimpan perubahan...');

    if (actDebounceTimerRef.current) {
      clearTimeout(actDebounceTimerRef.current);
      actDebounceTimerRef.current = null;
    }

    actDebounceTimerRef.current = setTimeout(async () => {
      actDebounceTimerRef.current = null;
      try {
        setIsSaving(true);
        const latestToSave = latestActRef.current.date === selectedDate ? latestActRef.current : activityReport;
        saveActivityReportLocalImmediate(latestToSave);
        const res = await saveActivityReport(latestToSave);
        lastSavedActRef.current = JSON.stringify(latestToSave);
        setSaveStatusText(
          res.isLocalFallback
            ? '✓ Tersimpan di Cadangan Lokal (Offline)'
            : '✓ Tersimpan otomatis ke Cloud'
        );
        setIsDbOnline(!res.isLocalFallback);
      } catch (err) {
        console.error('Auto save activity failed:', err);
        setSaveStatusText('Gagal menyimpan otomatis');
      } finally {
        setIsSaving(false);
      }
    }, 300); // 300ms fast debounce on keystroke

    return () => {
      if (actDebounceTimerRef.current) {
        clearTimeout(actDebounceTimerRef.current);
        actDebounceTimerRef.current = null;
      }
    };
  }, [activityReport, selectedDate]);

  // Debounced Auto-Save on EVERY text change in Checklist Report (No save button needed)
  useEffect(() => {
    if (isDateLoadedRef.current !== selectedDate) return;
    if (checklistReport.date !== selectedDate) return;

    const currentJson = JSON.stringify(checklistReport);
    if (currentJson === lastSavedCheckRef.current) return;

    setSaveStatusText('Menyimpan perubahan...');

    if (checkDebounceTimerRef.current) {
      clearTimeout(checkDebounceTimerRef.current);
      checkDebounceTimerRef.current = null;
    }

    checkDebounceTimerRef.current = setTimeout(async () => {
      checkDebounceTimerRef.current = null;
      try {
        setIsSaving(true);
        const latestToSave = latestCheckRef.current.date === selectedDate ? latestCheckRef.current : checklistReport;
        saveChecklistReportLocalImmediate(latestToSave);
        const res = await saveChecklistReport(latestToSave);
        lastSavedCheckRef.current = JSON.stringify(latestToSave);
        setSaveStatusText(
          res.isLocalFallback
            ? '✓ Tersimpan di Cadangan Lokal (Offline)'
            : '✓ Tersimpan otomatis ke Cloud'
        );
        setIsDbOnline(!res.isLocalFallback);
      } catch (err) {
        console.error('Auto save checklist failed:', err);
        setSaveStatusText('Gagal menyimpan otomatis');
      } finally {
        setIsSaving(false);
      }
    }, 300); // 300ms fast debounce

    return () => {
      if (checkDebounceTimerRef.current) {
        clearTimeout(checkDebounceTimerRef.current);
        checkDebounceTimerRef.current = null;
      }
    };
  }, [checklistReport, selectedDate]);

  // Synchronize Internet Traffic (IN) from Activity Section 3 to Checklist item #2
  const handleSyncTrafficToChecklist = (mIn: string, aIn: string, cIn: string) => {
    const cleanVal = (v: string) => v.replace(/mbps/gi, '').trim();
    const m = cleanVal(mIn);
    const a = cleanVal(aIn);
    const c = cleanVal(cIn);
    const formattedRemark = `MAX: ${m || '-'} Mbps | AVG: ${a || '-'} Mbps | CURRENT: ${c || '-'} Mbps`;
    setChecklistReport((prev) => {
      const items = [...prev.items];
      let targetIdx = items.findIndex((it) =>
        it.taskList.toLowerCase().includes('bandwidth')
      );
      if (targetIdx === -1 && items.length > 1) {
        targetIdx = 1;
      }
      if (targetIdx >= 0 && targetIdx < items.length) {
        items[targetIdx] = {
          ...items[targetIdx],
          remark: formattedRemark,
        };
      }
      const next: DailyChecklistReport = {
        ...prev,
        items,
        isUserModified: true,
        updatedAt: Date.now(),
      };
      latestCheckRef.current = next;
      saveChecklistReportLocalImmediate(next);
      return next;
    });
  };

  // Instant Manual Save trigger (if user clicks Simpan button)
  const handleSave = async () => {
    if (actDebounceTimerRef.current) {
      clearTimeout(actDebounceTimerRef.current);
      actDebounceTimerRef.current = null;
    }
    if (checkDebounceTimerRef.current) {
      clearTimeout(checkDebounceTimerRef.current);
      checkDebounceTimerRef.current = null;
    }

    setIsSaving(true);
    setSaveStatusText('Menyimpan data...');

    try {
      const actToSave: DailyActivityReport = {
        ...latestActRef.current,
        isUserModified: true,
        updatedAt: Date.now(),
      };
      latestActRef.current = actToSave;
      setActivityReport(actToSave);
      saveActivityReportLocalImmediate(actToSave);

      const checkToSave: DailyChecklistReport = {
        ...latestCheckRef.current,
        isUserModified: true,
        updatedAt: Date.now(),
      };
      latestCheckRef.current = checkToSave;
      setChecklistReport(checkToSave);
      saveChecklistReportLocalImmediate(checkToSave);

      const [actRes, checkRes] = await Promise.all([
        saveActivityReport(actToSave),
        saveChecklistReport(checkToSave),
      ]);

      lastSavedActRef.current = JSON.stringify(actToSave);
      lastSavedCheckRef.current = JSON.stringify(checkToSave);

      const isFallback = actRes.isLocalFallback || checkRes.isLocalFallback;
      setSaveStatusText(
        isFallback
          ? '✓ Tersimpan di Cadangan Lokal (Offline)'
          : '✓ Tersimpan otomatis ke Cloud'
      );
      setIsDbOnline(!isFallback);
      setNotification('✓ Data laporan Activity, Checklist & WA Report berhasil disimpan!');
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatusText('Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  };

  // Direct A4 PDF download using html2canvas-pro & jsPDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress({ progress: 10, text: 'Mempersiapkan dokumen A4...' });

    try {
      const formatPdfFilenameDate = (dateStr: string): string => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const [yyyy, mm, dd] = parts;
          return `${dd}-${mm}-${yyyy}`;
        }
        return dateStr;
      };

      const formattedDateForFile = formatPdfFilenameDate(selectedDate);

      if (activeTab === 'activity') {
        const p1 = actPage1Ref.current;
        const p2 = actPage2Ref.current;
        if (!p1 || !p2) {
          throw new Error('Halaman laporan belum siap dirender.');
        }

        const filename = `Daily Activities ${formattedDateForFile}.pdf`;
        await exportElementsToA4Pdf([p1, p2], filename, (prog, text) => {
          setPdfProgress({ progress: prog, text });
        });
      } else if (activeTab === 'checklist') {
        const pCheck = checklistPageRef.current;
        if (!pCheck) {
          throw new Error('Halaman checklist belum siap dirender.');
        }

        const filename = `Daily Checklist ${formattedDateForFile}.pdf`;
        await exportElementsToA4Pdf([pCheck], filename, (prog, text) => {
          setPdfProgress({ progress: prog, text });
        });
      } else {
        const waEl = document.getElementById('wa-report-card');
        if (!waEl) {
          throw new Error('Halaman WA Report belum siap.');
        }

        const filename = `WA Report ${formattedDateForFile}.pdf`;
        await exportElementsToA4Pdf([waEl], filename, (prog, text) => {
          setPdfProgress({ progress: prog, text });
        });
      }

      setNotification('PDF A4 berhasil diunduh ke perangkat Anda!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setNotification(`Gagal membuat file PDF langsung (${err.message}). Membuka dialog cetak browser...`);
      setTimeout(() => triggerNativePrint(), 600);
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const handlePrint = () => {
    triggerNativePrint();
  };

  const handleCleanupStorage = async () => {
    try {
      setNotification('Sedang memeriksa dan membersihkan data lama (>60 hari)...');
      const res = await runAutoCleanupExpiredRecords();
      const total = res.deletedActivities + res.deletedChecklists;
      setNotification(
        total > 0
          ? `✓ Pembersihan berhasil: ${total} dokumen lama (>60 hari) telah dihapus.`
          : '✓ Pemeriksaan selesai: Semua data dalam batas retensi 60 hari.'
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification('Gagal menjalankan pembersihan storage.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        setSelectedDate={handleSelectDate}
        onSave={handleSave}
        isSaving={isSaving}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
        onOpenQuotaModal={() => setIsQuotaModalOpen(true)}
        onCleanupStorage={handleCleanupStorage}
        customLogoUrl={customLogoUrl}
        saveStatusText={saveStatusText}
        isDbOnline={isDbOnline}
        onCheckDb={() => {
          setIsDbModalOpen(true);
          handleCheckDbConnection(true);
        }}
        checklistTaskCount={checklistReport.items.length}
      />

      {/* Main Container - Tidy & Compact without pushing down */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Notification Toast */}
        {notification && (
          <div className="no-print mb-3 p-2.5 sm:p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg border border-slate-700 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Section (Interactive Edit, Preview, or WA Report) */}
        {activeTab === 'wareport' ? (
          <WaReportView
            activityReport={activityReport}
            checklistReport={checklistReport}
            teamMembers={teamMembers}
            customLogoUrl={customLogoUrl}
            onUpdateChecklist={handleChecklistChange}
            onUpdateActivity={handleActivityChange}
          />
        ) : viewMode === 'edit' ? (
          <div>
            {activeTab === 'activity' ? (
              <DailyActivityForm
                report={activityReport}
                onChange={handleActivityChange}
                onSave={handleSave}
                isSaving={isSaving}
                teamMembers={teamMembers}
                onOpenTeamModal={() => setIsTeamModalOpen(true)}
                clientUsers={clientUsers}
                onOpenUserModal={() => setIsUserModalOpen(true)}
                onSyncTrafficToChecklist={handleSyncTrafficToChecklist}
                customLogoUrl={customLogoUrl}
                onOpenLogoModal={() => setIsLogoModalOpen(true)}
                onAutoSaveActivity={handleAutoSaveActivity}
              />
            ) : (
              <DailyChecklistForm
                report={checklistReport}
                onChange={handleChecklistChange}
                onSave={handleSave}
                isSaving={isSaving}
                teamMembers={teamMembers}
                onOpenTeamModal={() => setIsTeamModalOpen(true)}
                customLogoUrl={customLogoUrl}
                onOpenLogoModal={() => setIsLogoModalOpen(true)}
                onSyncFromPreviousDate={handleSyncFromPreviousDate}
              />
            )}
          </div>
        ) : (
          <div className="flex justify-center py-2 overflow-x-auto">
            {activeTab === 'activity' ? (
              <DailyActivityPrintView
                report={activityReport}
                customLogoUrl={customLogoUrl}
              />
            ) : (
              <DailyChecklistPrintView
                report={checklistReport}
                customLogoUrl={customLogoUrl}
              />
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PERMANENT OFF-SCREEN PDF RENDER PORTAL                                     */}
        {/* Crucial fix: elements are NEVER display:none so html2canvas always captures */}
        {/* complete layouts, exact 210mm width, fonts, and photos with zero blanks!   */}
        {/* ========================================================================= */}
        <div
          id="offscreen-pdf-portal"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '0',
            width: '210mm',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: -999,
          }}
          aria-hidden="true"
        >
          <DailyActivityPrintView
            report={activityReport}
            page1Ref={actPage1Ref}
            page2Ref={actPage2Ref}
            customLogoUrl={customLogoUrl}
          />
          <DailyChecklistPrintView
            report={checklistReport}
            pageRef={checklistPageRef}
            customLogoUrl={customLogoUrl}
          />
        </div>

        {/* ========================================================================= */}
        {/* NATIVE PRINT STYLESHEET CONTAINER (Visible only during window.print())     */}
        {/* ========================================================================= */}
        <div className="print-only hidden print:block">
          {activeTab === 'activity' ? (
            <DailyActivityPrintView
              report={activityReport}
              customLogoUrl={customLogoUrl}
            />
          ) : (
            <DailyChecklistPrintView
              report={checklistReport}
              customLogoUrl={customLogoUrl}
            />
          )}
        </div>
      </main>

      {/* PDF Export Progress Modal */}
      {isGeneratingPdf && pdfProgress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Download className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-slate-900 mb-1">
              Menghasilkan File PDF A4
            </h4>
            <p className="text-xs text-slate-500 mb-4">{pdfProgress.text}</p>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pdfProgress.progress}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-bold text-slate-700">
              {pdfProgress.progress}%
            </span>
          </div>
        </div>
      )}

      {/* History Archive Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectDate={(date) => {
          handleSelectDate(date);
        }}
        currentDate={selectedDate}
      />

      {/* Team Management Modal (IT PICs) */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onUpdateTeamMembers={handleUpdateTeamMembers}
        onSwitchToUserModal={() => setIsUserModalOpen(true)}
      />

      {/* User / Client Management Modal (Hotel Users & Departments) */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        clientUsers={clientUsers}
        onUpdateClientUsers={handleUpdateClientUsers}
        onSwitchToPicModal={() => setIsTeamModalOpen(true)}
      />

      {/* Custom Logo Manager Modal */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        customLogoUrl={customLogoUrl}
        onSaveLogo={handleSaveLogo}
      />

      {/* Database Connection & Security Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        connectionResult={dbConnectionResult}
        onRecheck={() => handleCheckDbConnection(true)}
        isChecking={isCheckingDb}
      />

      {/* Cloud & Realtime Quota Monitor Modal (Firebase Spark & Vercel Hobby) */}
      <QuotaMonitorModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        isDbOnline={isDbOnline}
        onCheckDb={() => handleCheckDbConnection(true)}
        isCheckingDb={isCheckingDb}
      />
    </div>
  );
}
