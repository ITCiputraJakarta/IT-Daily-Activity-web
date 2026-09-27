import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { DailyActivityReport, DailyChecklistReport, TeamMember, ClientUser } from '../types';
import { createChecklistFromPrevious, isChecklistCustomModified } from '../data/defaults';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Initialize Firebase App safely
const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null;
export const db = app ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);

export const COLLECTION_ACTIVITIES = 'daily_activities';
export const COLLECTION_CHECKLISTS = 'daily_checklists';

export const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000; // 60 days (2 months) retention policy
export const THIRTY_DAYS_MS = TWO_MONTHS_MS; // backwards compatibility alias

// LocalStorage keys for fallback/offline
const LS_PREFIX_ACTIVITY = 'hcj_it_activity_';
const LS_PREFIX_CHECKLIST = 'hcj_it_checklist_';

/**
 * Check and test connection to Firebase Firestore
 */
export async function checkFirestoreConnection(): Promise<{ isOnline: boolean; message: string; latencyMs?: number }> {
  if (!db) {
    return {
      isOnline: false,
      message: 'Mode Offline (Penyimpanan Lokal Aktif)',
    };
  }
  const start = performance.now();
  try {
    const testDocRef = doc(db, '_health_check', 'ping');
    await setDoc(testDocRef, { timestamp: Date.now() }, { merge: true });
    const latencyMs = Math.round(performance.now() - start);
    return {
      isOnline: true,
      message: `Terhubung ke Firebase Firestore (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (error: any) {
    console.warn('Firestore health check notice:', error);
    return {
      isOnline: false,
      message: error?.message?.includes('offline')
        ? 'Mode Offline (Penyimpanan Lokal Aktif)'
        : `Offline / Cadangan Lokal (${error?.message || 'Fallback mode'})`,
    };
  }
}

/**
 * Immediately persist Daily Activity Report to LocalStorage (0ms latency)
 */
export function saveActivityReportLocalImmediate(report: DailyActivityReport): void {
  const now = Date.now();
  const cleanedReport: DailyActivityReport = {
    ...report,
    updatedAt: report.updatedAt || now,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  };
  try {
    localStorage.setItem(LS_PREFIX_ACTIVITY + report.date, JSON.stringify(cleanedReport));
  } catch (e) {
    console.warn('LocalStorage immediate activity save failed:', e);
  }
}

/**
 * Propagate an edited checklist's default state forward to any already-created future dates
 * (> sourceReport.date) in LocalStorage that have NOT been manually edited (isUserModified === false),
 * stopping at the first future date that WAS manually edited (isUserModified === true).
 */
export function propagateChecklistLocalForward(sourceReport: DailyChecklistReport): string[] {
  const updatedFutureDates: string[] = [];
  try {
    const futureKeys: { date: string; key: string }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_PREFIX_CHECKLIST)) {
        const d = k.replace(LS_PREFIX_CHECKLIST, '');
        if (d > sourceReport.date) {
          futureKeys.push({ date: d, key: k });
        }
      }
    }
    futureKeys.sort((a, b) => a.date.localeCompare(b.date));

    for (const { date, key } of futureKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as DailyChecklistReport;
        if (parsed.isUserModified === true) {
          // Stop propagating once we hit a future date that was explicitly edited by the user
          break;
        }
        const inherited = createChecklistFromPrevious(date, sourceReport);
        localStorage.setItem(key, JSON.stringify(inherited));
        updatedFutureDates.push(date);
      } catch {
        // ignore parse errors
      }
    }
  } catch (e) {
    console.warn('Forward checklist propagation warning:', e);
  }
  return updatedFutureDates;
}

/**
 * Immediately persist Daily Checklist Report to LocalStorage (0ms latency)
 */
export function saveChecklistReportLocalImmediate(report: DailyChecklistReport): void {
  const now = Date.now();
  const cleanedReport: DailyChecklistReport = {
    ...report,
    updatedAt: report.updatedAt || now,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  };
  try {
    localStorage.setItem(LS_PREFIX_CHECKLIST + report.date, JSON.stringify(cleanedReport));
    if (cleanedReport.isUserModified) {
      propagateChecklistLocalForward(cleanedReport);
    }
  } catch (e) {
    console.warn('LocalStorage immediate checklist save failed:', e);
  }
}

/**
 * Save Daily Activity Report to Firestore (with localStorage fallback)
 */
export async function saveActivityReport(report: DailyActivityReport): Promise<{ success: boolean; isLocalFallback?: boolean }> {
  const now = Date.now();
  const cleanedReport: DailyActivityReport = {
    ...report,
    updatedAt: now,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  };

  // Always keep in local storage as instant backup
  try {
    localStorage.setItem(LS_PREFIX_ACTIVITY + report.date, JSON.stringify(cleanedReport));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  if (!db) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const docRef = doc(db, COLLECTION_ACTIVITIES, report.date);
    await setDoc(docRef, cleanedReport);
    return { success: true };
  } catch (error) {
    console.error('Firestore saveActivityReport error, using local fallback:', error);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Load Daily Activity Report by Date (picks newest between Cloud and LocalStorage)
 */
export async function loadActivityReport(dateStr: string): Promise<DailyActivityReport | null> {
  let cloudReport: DailyActivityReport | null = null;
  let localReport: DailyActivityReport | null = null;

  const local = localStorage.getItem(LS_PREFIX_ACTIVITY + dateStr);
  if (local) {
    try {
      localReport = JSON.parse(local) as DailyActivityReport;
    } catch {
      localReport = null;
    }
  }

  if (db) {
    try {
      const docRef = doc(db, COLLECTION_ACTIVITIES, dateStr);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        cloudReport = snap.data() as DailyActivityReport;
      }
    } catch (error) {
      console.warn('Firestore loadActivityReport failed, checking local storage:', error);
    }
  }

  if (cloudReport && localReport) {
    return (localReport.updatedAt || 0) >= (cloudReport.updatedAt || 0)
      ? localReport
      : cloudReport;
  }
  return localReport || cloudReport || null;
}

/**
 * Save Daily Checklist Report to Firestore
 */
export async function saveChecklistReport(report: DailyChecklistReport): Promise<{ success: boolean; isLocalFallback?: boolean }> {
  const now = Date.now();
  const cleanedReport: DailyChecklistReport = {
    ...report,
    updatedAt: now,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  };

  let propagatedDates: string[] = [];
  try {
    localStorage.setItem(LS_PREFIX_CHECKLIST + report.date, JSON.stringify(cleanedReport));
    if (cleanedReport.isUserModified) {
      propagatedDates = propagateChecklistLocalForward(cleanedReport);
    }
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  if (!db) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const docRef = doc(db, COLLECTION_CHECKLISTS, report.date);
    await setDoc(docRef, cleanedReport);

    // Also sync any forward-propagated unedited future dates to Firestore
    for (const futDate of propagatedDates) {
      const rawFut = localStorage.getItem(LS_PREFIX_CHECKLIST + futDate);
      if (rawFut) {
        const parsedFut = JSON.parse(rawFut) as DailyChecklistReport;
        await setDoc(doc(db, COLLECTION_CHECKLISTS, futDate), parsedFut);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Firestore saveChecklistReport error, using local fallback:', error);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Load Daily Checklist Report by Date (picks newest between Cloud and LocalStorage)
 */
export async function loadChecklistReport(dateStr: string): Promise<DailyChecklistReport | null> {
  let cloudReport: DailyChecklistReport | null = null;
  let localReport: DailyChecklistReport | null = null;

  const local = localStorage.getItem(LS_PREFIX_CHECKLIST + dateStr);
  if (local) {
    try {
      localReport = JSON.parse(local) as DailyChecklistReport;
    } catch {
      localReport = null;
    }
  }

  if (db) {
    try {
      const docRef = doc(db, COLLECTION_CHECKLISTS, dateStr);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        cloudReport = snap.data() as DailyChecklistReport;
      }
    } catch (error) {
      console.warn('Firestore loadChecklistReport failed, checking local storage:', error);
    }
  }

  if (cloudReport && localReport) {
    return (localReport.updatedAt || 0) >= (cloudReport.updatedAt || 0)
      ? localReport
      : cloudReport;
  }
  return localReport || cloudReport || null;
}

/**
 * Finds the most recent saved DailyChecklistReport prior to `targetDate` (date < targetDate).
 * Prioritizes reports that were explicitly edited by the user (`isChecklistCustomModified(rep) === true`),
 * so that when moving to a new date, the default view follows the previous date's checklist
 * (Morning Shift PIC, Evening Shift PIC, and all checklist tasks/contents).
 */
export async function loadPreviousChecklistReport(targetDate: string): Promise<DailyChecklistReport | null> {
  const byDate = new Map<string, DailyChecklistReport>();

  // 1. Collect from LocalStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_PREFIX_CHECKLIST)) {
        const d = key.replace(LS_PREFIX_CHECKLIST, '');
        if (d < targetDate) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as DailyChecklistReport;
              byDate.set(d, parsed);
            } catch {
              // ignore
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read previous checklists from localStorage:', e);
  }

  // 2. Collect from Firestore if online
  if (db) {
    try {
      const snap = await getDocs(collection(db, COLLECTION_CHECKLISTS));
      snap.forEach((docSnap) => {
        const d = docSnap.id;
        if (d < targetDate) {
          const cloudData = docSnap.data() as DailyChecklistReport;
          const existing = byDate.get(d);
          if (!existing || (cloudData.updatedAt || 0) > (existing.updatedAt || 0)) {
            byDate.set(d, cloudData);
          }
        }
      });
    } catch (e) {
      console.warn('Could not query previous checklists from Firestore:', e);
    }
  }

  const sortedDatesDesc = Array.from(byDate.keys()).sort().reverse();
  if (sortedDatesDesc.length === 0) {
    return null;
  }

  // First, look for the most recent previous date that was explicitly modified by the user
  for (const d of sortedDatesDesc) {
    const candidate = byDate.get(d);
    if (candidate && isChecklistCustomModified(candidate)) {
      return candidate;
    }
  }

  // Fallback to the immediate previous saved checklist (< targetDate)
  return byDate.get(sortedDatesDesc[0]) || null;
}

/**
 * Automatic cleanup of records older than 2 months (60 days)
 * Fulfills: "laporan bertahan selama 2 bulan dari hari ini (today) pada tanggal aktif"
 */
export async function runAutoCleanupExpiredRecords(maxAgeMs = TWO_MONTHS_MS): Promise<{ deletedActivities: number; deletedChecklists: number }> {
  const now = Date.now();
  const cutoffTime = now - maxAgeMs;
  let deletedActivities = 0;
  let deletedChecklists = 0;

  if (db) {
    try {
      // 1. Cleanup expired activities
      const actQuery = query(
        collection(db, COLLECTION_ACTIVITIES),
        where('createdAt', '<', cutoffTime)
      );
      const actSnap = await getDocs(actQuery);
      for (const d of actSnap.docs) {
        await deleteDoc(doc(db, COLLECTION_ACTIVITIES, d.id));
        deletedActivities++;
      }

      // 2. Cleanup expired checklists
      const checkQuery = query(
        collection(db, COLLECTION_CHECKLISTS),
        where('createdAt', '<', cutoffTime)
      );
      const checkSnap = await getDocs(checkQuery);
      for (const d of checkSnap.docs) {
        await deleteDoc(doc(db, COLLECTION_CHECKLISTS, d.id));
        deletedChecklists++;
      }
    } catch (error) {
      console.warn('Auto cleanup Firestore encountered an error:', error);
    }
  }

  // Also clean local storage for expired items
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(LS_PREFIX_ACTIVITY) || key.startsWith(LS_PREFIX_CHECKLIST))) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.createdAt && item.createdAt < cutoffTime) {
            localStorage.removeItem(key);
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  } catch (e) {
    console.warn('Local cleanup error:', e);
  }

  return { deletedActivities, deletedChecklists };
}

/**
 * List all saved report dates
 */
export async function getSavedReportDates(): Promise<{ activityDates: string[]; checklistDates: string[] }> {
  const activityDates: Set<string> = new Set();
  const checklistDates: Set<string> = new Set();

  if (db) {
    try {
      const actSnap = await getDocs(collection(db, COLLECTION_ACTIVITIES));
      actSnap.forEach((d) => activityDates.add(d.id));

      const checkSnap = await getDocs(collection(db, COLLECTION_CHECKLISTS));
      checkSnap.forEach((d) => checklistDates.add(d.id));
    } catch (err) {
      console.warn('Could not query Firestore collections:', err);
    }
  }

  // Also read from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LS_PREFIX_ACTIVITY)) {
      activityDates.add(key.replace(LS_PREFIX_ACTIVITY, ''));
    } else if (key?.startsWith(LS_PREFIX_CHECKLIST)) {
      checklistDates.add(key.replace(LS_PREFIX_CHECKLIST, ''));
    }
  }

  return {
    activityDates: Array.from(activityDates).sort().reverse(),
    checklistDates: Array.from(checklistDates).sort().reverse(),
  };
}

/**
 * Save custom logo to Firestore so all devices/users share the exact same branding
 */
export async function saveAppLogoToCloud(logoUrl: string | null): Promise<void> {
  if (!db) return;
  try {
    const logoDocRef = doc(db, 'app_settings', 'company_logo');
    await setDoc(
      logoDocRef,
      {
        logoUrl: logoUrl || '',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not save logo to Firestore:', err);
  }
}

/**
 * Load custom logo from Firestore
 */
export async function loadAppLogoFromCloud(): Promise<string | null> {
  if (!db) return null;
  try {
    const logoDocRef = doc(db, 'app_settings', 'company_logo');
    const snap = await getDoc(logoDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return data?.logoUrl || null;
    }
  } catch (err) {
    console.warn('Could not load logo from Firestore:', err);
  }
  return null;
}

/**
 * Save IT PIC team members to Firestore so all devices/users share the exact same active team
 */
export async function saveTeamMembersToCloud(members: TeamMember[]): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'app_settings', 'team_members');
    await setDoc(
      docRef,
      {
        members,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not save team members to Firestore:', err);
  }
}

/**
 * Load IT PIC team members from Firestore
 */
export async function loadTeamMembersFromCloud(): Promise<TeamMember[] | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'app_settings', 'team_members');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.members) && data.members.length > 0) {
        return data.members as TeamMember[];
      }
    }
  } catch (err) {
    console.warn('Could not load team members from Firestore:', err);
  }
  return null;
}

/**
 * Save Client Users (User / Departemen) to Firestore separately from IT PICs
 */
export async function saveClientUsersToCloud(users: ClientUser[]): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'app_settings', 'client_users');
    await setDoc(
      docRef,
      {
        users,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not save client users to Firestore:', err);
  }
}

/**
 * Load Client Users (User / Departemen) from Firestore
 */
export async function loadClientUsersFromCloud(): Promise<ClientUser[] | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'app_settings', 'client_users');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.users) && data.users.length > 0) {
        return data.users as ClientUser[];
      }
    }
  } catch (err) {
    console.warn('Could not load client users from Firestore:', err);
  }
  return null;
}


