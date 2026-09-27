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
import { DailyActivityReport, DailyChecklistReport, TeamMember } from '../types';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCBuEIu1ITK40brP7SCWKQOQBdaMDFQx6M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-ctivity-itbg.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-ctivity-itbg",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-ctivity-itbg.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "927845263252",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:927845263252:web:92522c80b69caf611a1181"
};

// Initialize Firebase App safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

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
 * Load Daily Activity Report by Date
 */
export async function loadActivityReport(dateStr: string): Promise<DailyActivityReport | null> {
  try {
    const docRef = doc(db, COLLECTION_ACTIVITIES, dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DailyActivityReport;
    }
  } catch (error) {
    console.warn('Firestore loadActivityReport failed, checking local storage:', error);
  }

  // Fallback to local storage
  const local = localStorage.getItem(LS_PREFIX_ACTIVITY + dateStr);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  return null;
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

  try {
    localStorage.setItem(LS_PREFIX_CHECKLIST + report.date, JSON.stringify(cleanedReport));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }

  try {
    const docRef = doc(db, COLLECTION_CHECKLISTS, report.date);
    await setDoc(docRef, cleanedReport);
    return { success: true };
  } catch (error) {
    console.error('Firestore saveChecklistReport error, using local fallback:', error);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Load Daily Checklist Report by Date
 */
export async function loadChecklistReport(dateStr: string): Promise<DailyChecklistReport | null> {
  try {
    const docRef = doc(db, COLLECTION_CHECKLISTS, dateStr);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as DailyChecklistReport;
    }
  } catch (error) {
    console.warn('Firestore loadChecklistReport failed, checking local storage:', error);
  }

  const local = localStorage.getItem(LS_PREFIX_CHECKLIST + dateStr);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      return null;
    }
  }
  return null;
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

  try {
    const actSnap = await getDocs(collection(db, COLLECTION_ACTIVITIES));
    actSnap.forEach((d) => activityDates.add(d.id));

    const checkSnap = await getDocs(collection(db, COLLECTION_CHECKLISTS));
    checkSnap.forEach((d) => checklistDates.add(d.id));
  } catch (err) {
    console.warn('Could not query Firestore collections:', err);
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


