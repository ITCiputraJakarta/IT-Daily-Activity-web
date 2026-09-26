import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DailyActivityReport,
  DailyChecklistReport,
  TeamMember
} from './types';
import {
  createDefaultActivityReport,
  createDefaultChecklistReport
} from './data/defaults';
import {
  loadTeamMembers,
  saveTeamMembersToStorage
} from './data/teamMembers';
import {
  getCustomLogo,
  saveCustomLogo,
  removeCustomLogo
} from './utils/logoStorage';
import {
  saveActivityReport,
  loadActivityReport,
  saveChecklistReport,
  loadChecklistReport,
  runAutoCleanupExpiredRecords,
  checkFirestoreConnection,
  saveAppLogoToCloud,
  loadAppLogoFromCloud
} from './services/firebase';
import { exportElementsToA4Pdf, triggerNativePrint } from './utils/pdfExport';
import { formatReportDate, getTodayDateString } from './utils/imageUtils';
import { Navbar } from './components/Navbar';
import { DailyActivityForm } from './components/DailyActivityForm';
import { DailyActivityPrintView } from './components/DailyActivityPrintView';
import { DailyChecklistForm } from './components/DailyChecklistForm';
import { DailyChecklistPrintView } from './components/DailyChecklistPrintView';
import { StorageCleanupBanner } from './components/StorageCleanupBanner';
import { HistoryModal } from './components/HistoryModal';
import { TeamManagementModal } from './components/TeamManagementModal';
import { LogoManagerModal } from './components/LogoManagerModal';
import {
  Download,
  CheckCircle,
  AlertCircle,
  Wifi,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'activity' | 'checklist'>('activity');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Custom Logo state (cached locally and synced with Cloud Firestore)
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => getCustomLogo());
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadTeamMembers());
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);

  // Reports
  const [activityReport, setActivityReport] = useState<DailyActivityReport>(() =>
    createDefaultActivityReport(getTodayDateString())
  );
  const [checklistReport, setChecklistReport] = useState<DailyChecklistReport>(() =>
    createDefaultChecklistReport(getTodayDateString())
  );

  const [isDbOnline, setIsDbOnline] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusText, setSaveStatusText] = useState<string>('Tersimpan di Cloud Firebase');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ progress: number; text: string } | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // References for PDF rendering (mounted in always-visible off-screen portal)
  const actPage1Ref = useRef<HTMLDivElement | null>(null);
  const actPage2Ref = useRef<HTMLDivElement | null>(null);
  const checklistPageRef = useRef<HTMLDivElement | null>(null);

  // Test Firebase connection
  const handleCheckDbConnection = useCallback(async () => {
    const res = await checkFirestoreConnection();
    setIsDbOnline(res.isOnline);
    setNotification(res.message);
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Update team members and save to local storage (with cascading report updates on name edit)
  const handleUpdateTeamMembers = (
    updated: TeamMember[],
    nameChange?: { oldName: string; newName: string }
  ) => {
    setTeamMembers(updated);
    saveTeamMembersToStorage(updated);

    if (nameChange) {
      const { oldName, newName } = nameChange;

      // Cascade to active Daily Activity report
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
          };
          saveActivityReport(updatedRep).catch(console.error);
          return updatedRep;
        }
        return prev;
      });

      // Cascade to active Daily Checklist report
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
          };
          saveChecklistReport(updatedCheck).catch(console.error);
          return updatedCheck;
        }
        return prev;
      });

      setNotification(`Data petugas "${oldName}" diperbarui menjadi "${newName}"`);
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Auto-save immediately to Firestore & Local Storage when image is uploaded or modified
  const handleAutoSaveActivity = useCallback(async (updated: DailyActivityReport) => {
    setIsSaving(true);
    setSaveStatusText('Menyimpan foto ke database...');
    try {
      const res = await saveActivityReport(updated);
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

  // Run connection check, load cloud logo, and auto-cleanup on mount
  useEffect(() => {
    handleCheckDbConnection();

    // Check if cloud has a synced logo
    loadAppLogoFromCloud().then((cloudLogo) => {
      if (cloudLogo) {
        setCustomLogoUrl(cloudLogo);
        saveCustomLogo(cloudLogo);
      }
    });

    runAutoCleanupExpiredRecords().then((res) => {
      const total = res.deletedActivities + res.deletedChecklists;
      if (total > 0) {
        setNotification(
          `Auto-cleanup storage: ${total} data lama (>30 hari) berhasil dibersihkan otomatis.`
        );
      }
    });
  }, [handleCheckDbConnection]);

  // When selectedDate changes, load data for that date
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      const loadedAct = await loadActivityReport(selectedDate);
      if (!isCancelled) {
        if (loadedAct) {
          setActivityReport(loadedAct);
        } else {
          setActivityReport(createDefaultActivityReport(selectedDate));
        }
      }

      const loadedCheck = await loadChecklistReport(selectedDate);
      if (!isCancelled) {
        if (loadedCheck) {
          setChecklistReport(loadedCheck);
        } else {
          setChecklistReport(createDefaultChecklistReport(selectedDate));
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  // Synchronize Internet Traffic (IN) from Activity Section 3 to Checklist item #2
  const handleSyncTrafficToChecklist = (mIn: string, aIn: string, cIn: string) => {
    const formattedRemark = `MAX: ${mIn || '-'} Mbps | AVG: ${aIn || '-'} Mbps | CR: ${cIn || '-'} Mbps`;
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
      return {
        ...prev,
        items,
      };
    });
  };

  // Save active report
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatusText('Menyimpan data...');

    try {
      if (activeTab === 'activity') {
        const res = await saveActivityReport(activityReport);
        setSaveStatusText(
          res.isLocalFallback
            ? '✓ Tersimpan di Cadangan Lokal (Offline)'
            : '✓ Tersimpan di Firebase Firestore'
        );
        setIsDbOnline(!res.isLocalFallback);
      } else {
        const res = await saveChecklistReport(checklistReport);
        setSaveStatusText(
          res.isLocalFallback
            ? '✓ Tersimpan di Cadangan Lokal (Offline)'
            : '✓ Tersimpan di Firebase Firestore'
        );
        setIsDbOnline(!res.isLocalFallback);
      }
      setNotification('Data laporan berhasil disimpan!');
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
      } else {
        const pCheck = checklistPageRef.current;
        if (!pCheck) {
          throw new Error('Halaman checklist belum siap dirender.');
        }

        const filename = `Daily Checklist ${formattedDateForFile}.pdf`;
        await exportElementsToA4Pdf([pCheck], filename, (prog, text) => {
          setPdfProgress({ progress: prog, text });
        });
      }

      setNotification('PDF A4 berhasil diunduh ke perangkat Anda!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      if (
        confirm(
          `Gagal membuat file PDF langsung (${err.message}). Buka dialog Cetak Browser untuk simpan sebagai PDF?`
        )
      ) {
        triggerNativePrint();
      }
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress(null);
    }
  };

  const handlePrint = () => {
    triggerNativePrint();
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
        setSelectedDate={setSelectedDate}
        onSave={handleSave}
        isSaving={isSaving}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
        customLogoUrl={customLogoUrl}
        saveStatusText={saveStatusText}
        isDbOnline={isDbOnline}
        onCheckDb={handleCheckDbConnection}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 md:py-6">
        {/* Notification Toast */}
        {notification && (
          <div className="no-print mb-4 p-3 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 30-Day Storage Retention Banner */}
        <div className="no-print">
          <StorageCleanupBanner onNotify={(msg) => setNotification(msg)} />
        </div>

        {/* Mode Info Bar */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-5 bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Laporan:
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {activeTab === 'activity'
                ? 'IT Daily Activity Report (2 Halaman A4)'
                : 'IT Daily Checklist Activity (31 Task)'}
            </span>
            <span className="text-xs text-slate-600 font-medium">
              · {formatReportDate(selectedDate)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {viewMode === 'edit' ? (
              <span className="text-slate-700 bg-slate-100 font-semibold px-2.5 py-1 rounded-md">
                Mode Input Form (Mobile & Tablet Siap)
              </span>
            ) : (
              <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 font-bold px-2.5 py-1 rounded-md">
                Mode Preview Layout A4 Asli
              </span>
            )}
          </div>
        </div>

        {/* Content Section (Interactive Edit or Preview) */}
        {viewMode === 'edit' ? (
          <div>
            {activeTab === 'activity' ? (
              <DailyActivityForm
                report={activityReport}
                onChange={setActivityReport}
                onSave={handleSave}
                isSaving={isSaving}
                teamMembers={teamMembers}
                onOpenTeamModal={() => setIsTeamModalOpen(true)}
                onSyncTrafficToChecklist={handleSyncTrafficToChecklist}
                customLogoUrl={customLogoUrl}
                onOpenLogoModal={() => setIsLogoModalOpen(true)}
                onAutoSaveActivity={handleAutoSaveActivity}
              />
            ) : (
              <DailyChecklistForm
                report={checklistReport}
                onChange={setChecklistReport}
                onSave={handleSave}
                isSaving={isSaving}
                teamMembers={teamMembers}
                onOpenTeamModal={() => setIsTeamModalOpen(true)}
                customLogoUrl={customLogoUrl}
                onOpenLogoModal={() => setIsLogoModalOpen(true)}
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
          setSelectedDate(date);
          setNotification(`Menampilkan laporan tanggal ${date}`);
          setTimeout(() => setNotification(null), 3000);
        }}
        currentDate={selectedDate}
      />

      {/* Team Management Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onUpdateTeamMembers={handleUpdateTeamMembers}
      />

      {/* Custom Logo Manager Modal */}
      <LogoManagerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        customLogoUrl={customLogoUrl}
        onSaveLogo={handleSaveLogo}
      />
    </div>
  );
}
