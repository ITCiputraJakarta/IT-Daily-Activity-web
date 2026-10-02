import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocFromServer,
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
import {
  createChecklistFromPrevious,
  isChecklistCustomModified,
  isActivityCustomModified
} from '../data/defaults';
import {
  recordFirebaseRead,
  recordFirebaseWrite,
  recordFirebaseDelete
} from './quotaTracker';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCBuEIu1ITK40brP7SCWKQOQBdaMDFQx6M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "daily-ctivity-itbg.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "daily-ctivity-itbg",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "daily-ctivity-itbg.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "927845263252",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:927845263252:web:92522c80b69caf611a1181"
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Initialize Firebase App safely
const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

// Initialize Firestore with persistent multi-tab local cache and ignoreUndefinedProperties
let firestoreDb: ReturnType<typeof getFirestore>;
if (app) {
  try {
    firestoreDb = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    try {
      firestoreDb = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
      });
    } catch {
      firestoreDb = getFirestore(app);
    }
  }
} else {
  firestoreDb = null as unknown as ReturnType<typeof getFirestore>;
}
export const db = firestoreDb;

export const COLLECTION_ACTIVITIES = 'daily_activities';
export const COLLECTION_CHECKLISTS = 'daily_checklists';

export const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000; // 60 days (2 months) retention policy
export const THIRTY_DAYS_MS = TWO_MONTHS_MS; // backwards compatibility alias

// LocalStorage keys for fallback/offline
const LS_PREFIX_ACTIVITY = 'hcj_it_activity_';
const LS_PREFIX_CHECKLIST = 'hcj_it_checklist_';

export interface DbConnectionResult {
  isOnline: boolean;
  message: string;
  latencyMs?: number;
  projectId?: string;
  testedAt?: number;
  writeOk?: boolean;
  readOk?: boolean;
  errorCode?: string;
}

/**
 * Check and test connection to Firebase Firestore with timeout and two-way verification
 */
export async function checkFirestoreConnection(): Promise<DbConnectionResult> {
  const testedAt = Date.now();
  if (!db) {
    return {
      isOnline: false,
      message: 'Mode Offline (Firebase belum dikonfigurasi)',
      projectId: firebaseConfig.projectId,
      testedAt,
      writeOk: false,
      readOk: false,
    };
  }

  const start = performance.now();
  try {
    const pingTask = (async () => {
      const testDocRef = doc(db, '_health_check', 'ping');
      // 1. Test Write
      await setDoc(
        testDocRef,
        {
          timestamp: Date.now(),
          project: firebaseConfig.projectId,
          clientTime: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Test Direct Server Read
      let readOk = false;
      try {
        const snap = await getDocFromServer(testDocRef);
        readOk = snap.exists();
      } catch {
        // Fallback to cache/default if getDocFromServer is restricted by environment
        readOk = true;
      }

      return { writeOk: true, readOk };
    })();

    // 5-second timeout to prevent hanging on stalled networks
    const timeoutTask = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi timeout (>5s)')), 5000)
    );

    const { writeOk, readOk } = await Promise.race([pingTask, timeoutTask]);
    const latencyMs = Math.round(performance.now() - start);

    return {
      isOnline: true,
      message: `Terhubung ke Firebase Firestore (${firebaseConfig.projectId} · ${latencyMs}ms)`,
      latencyMs,
      projectId: firebaseConfig.projectId,
      testedAt,
      writeOk,
      readOk,
    };
  } catch (error: any) {
    console.warn('Firestore health check notice:', error);
    const msg = error?.message || '';
    let userMsg = 'Offline / Cadangan Lokal';
    let errorCode = 'offline';

    if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
      userMsg = 'Akses Ditolak: Periksa Security Rules di Firebase Console';
      errorCode = 'permission-denied';
    } else if (msg.includes('timeout')) {
      userMsg = 'Koneksi Lambat / Timeout (Cadangan Lokal Aktif)';
      errorCode = 'timeout';
    } else if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('UNAVAILABLE')) {
      userMsg = 'Mode Offline (Penyimpanan Cadangan Lokal Aktif)';
      errorCode = 'unavailable';
    }

    return {
      isOnline: false,
      message: userMsg,
      projectId: firebaseConfig.projectId,
      testedAt,
      writeOk: false,
      readOk: false,
      errorCode,
    };
  }
}

// Helper to remove any undefined properties so Firestore setDoc never throws Unsupported field value: undefined
function sanitizeForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Safely writes to LocalStorage, automatically evicting oldest cached reports if QuotaExceededError occurs
 */
function safeSetLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    try {
      const reportKeys: { k: string; date: string }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          k !== key &&
          (k.startsWith(LS_PREFIX_ACTIVITY) || k.startsWith(LS_PREFIX_CHECKLIST))
        ) {
          const date = k
            .replace(LS_PREFIX_ACTIVITY, '')
            .replace(LS_PREFIX_CHECKLIST, '');
          reportKeys.push({ k, date });
        }
      }
      reportKeys.sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 0; i < Math.min(5, reportKeys.length); i++) {
        localStorage.removeItem(reportKeys[i].k);
      }
      localStorage.setItem(key, value);
    } catch (retryErr) {
      console.warn('LocalStorage quota full even after cleanup:', retryErr);
    }
  }
}

/**
 * Counts how many non-empty photos exist in a DailyActivityReport
 */
function countActivityPhotos(rep: DailyActivityReport | null | undefined): number {
  if (!rep) return 0;
  let count = 0;
  if (Array.isArray(rep.logBookActivities)) {
    for (const act of rep.logBookActivities) {
      if (act?.pictureUrl?.trim()) count++;
    }
  }
  if (rep.saraActivity?.screenshotUrl?.trim()) count++;
  if (rep.internetTraffic?.screenshotUrl?.trim()) count++;
  if (rep.serverTemperature?.photoUrl?.trim()) count++;
  return count;
}

/**
 * Immediately persist Daily Activity Report to LocalStorage (0ms latency)
 */
export function saveActivityReportLocalImmediate(report: DailyActivityReport): void {
  if (!report || !report.date) return;
  const now = Date.now();
  const isModified = report.isUserModified ?? isActivityCustomModified(report);
  const cleanedReport: DailyActivityReport = {
    ...report,
    propertyName: report.propertyName || 'Hotel Ciputra Jakarta',
    isUserModified: isModified,
    updatedAt: isModified ? Math.max(report.updatedAt || 0, now) : 0,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  };
  safeSetLocalStorage(LS_PREFIX_ACTIVITY + report.date, JSON.stringify(cleanedReport));
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
        safeSetLocalStorage(key, JSON.stringify(inherited));
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
  if (!report || !report.date) return;
  const now = Date.now();
  const isModified = report.isUserModified ?? isChecklistCustomModified(report);
  const cleanedReport: DailyChecklistReport = {
    ...report,
    propertyName: report.propertyName || 'Hotel Ciputra Jakarta',
    items: Array.isArray(report.items) ? report.items : [],
    isUserModified: isModified,
    updatedAt: isModified ? Math.max(report.updatedAt || 0, now) : 0,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  };
  safeSetLocalStorage(LS_PREFIX_CHECKLIST + report.date, JSON.stringify(cleanedReport));
  if (cleanedReport.isUserModified) {
    propagateChecklistLocalForward(cleanedReport);
  }
}

/**
 * Save Daily Activity Report to Firestore (with localStorage fallback)
 */
export async function saveActivityReport(report: DailyActivityReport): Promise<{ success: boolean; isLocalFallback?: boolean }> {
  if (!report || !report.date) {
    return { success: false, isLocalFallback: true };
  }
  const now = Date.now();
  const isModified = report.isUserModified ?? isActivityCustomModified(report);
  const cleanedReport: DailyActivityReport = sanitizeForFirestore({
    ...report,
    propertyName: report.propertyName || 'Hotel Ciputra Jakarta',
    isUserModified: isModified,
    updatedAt: isModified ? Math.max(report.updatedAt || 0, now) : 0,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  });

  // Always keep in local storage as instant backup
  safeSetLocalStorage(LS_PREFIX_ACTIVITY + report.date, JSON.stringify(cleanedReport));

  if (!db) {
    return { success: true, isLocalFallback: true };
  }

  try {
    const docRef = doc(db, COLLECTION_ACTIVITIES, report.date);
    await setDoc(docRef, cleanedReport);
    recordFirebaseWrite(1, 'Simpan Daily Activity');
    return { success: true };
  } catch (error) {
    console.error('Firestore saveActivityReport error, using local fallback:', error);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Load Daily Activity Report by Date (prioritizes user-modified/uploaded data and syncs between Cloud & LocalStorage)
 */
export async function loadActivityReport(dateStr: string): Promise<DailyActivityReport | null> {
  if (!dateStr) return null;
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
        recordFirebaseRead(1, 'Baca Daily Activity');
      }
    } catch (error) {
      console.warn('Firestore loadActivityReport failed, checking local storage:', error);
    }
  }

  if (cloudReport && localReport) {
    const cloudHasData = isActivityCustomModified(cloudReport);
    const localHasData = isActivityCustomModified(localReport);

    // Never let an unedited blank template overwrite a report that has real user data or uploaded photos
    if (cloudHasData && !localHasData) {
      safeSetLocalStorage(LS_PREFIX_ACTIVITY + dateStr, JSON.stringify(cloudReport));
      return cloudReport;
    }
    if (localHasData && !cloudHasData) {
      if (db) {
        setDoc(doc(db, COLLECTION_ACTIVITIES, dateStr), sanitizeForFirestore(localReport)).catch(() => {});
      }
      return localReport;
    }

    const cloudPhotos = countActivityPhotos(cloudReport);
    const localPhotos = countActivityPhotos(localReport);

    if ((localReport.updatedAt || 0) >= (cloudReport.updatedAt || 0)) {
      safeSetLocalStorage(LS_PREFIX_ACTIVITY + dateStr, JSON.stringify(localReport));
      if (db && localHasData) {
        setDoc(doc(db, COLLECTION_ACTIVITIES, dateStr), sanitizeForFirestore(localReport)).catch(() => {});
      }
      return localReport;
    } else {
      safeSetLocalStorage(LS_PREFIX_ACTIVITY + dateStr, JSON.stringify(cloudReport));
      return cloudReport;
    }
  }

  if (cloudReport) {
    safeSetLocalStorage(LS_PREFIX_ACTIVITY + dateStr, JSON.stringify(cloudReport));
    return cloudReport;
  }

  if (localReport) {
    if (db && isActivityCustomModified(localReport)) {
      setDoc(doc(db, COLLECTION_ACTIVITIES, dateStr), sanitizeForFirestore(localReport)).catch(() => {});
    }
    return localReport;
  }

  return null;
}

/**
 * Save Daily Checklist Report to Firestore
 */
export async function saveChecklistReport(report: DailyChecklistReport): Promise<{ success: boolean; isLocalFallback?: boolean }> {
  if (!report || !report.date) {
    return { success: false, isLocalFallback: true };
  }
  const now = Date.now();
  const isModified = report.isUserModified ?? isChecklistCustomModified(report);
  const cleanedReport: DailyChecklistReport = sanitizeForFirestore({
    ...report,
    propertyName: report.propertyName || 'Hotel Ciputra Jakarta',
    items: Array.isArray(report.items) ? report.items : [],
    isUserModified: isModified,
    updatedAt: isModified ? Math.max(report.updatedAt || 0, now) : 0,
    createdAt: report.createdAt || now,
    expiresAt: report.expiresAt || (now + TWO_MONTHS_MS),
  });

  let propagatedDates: string[] = [];
  safeSetLocalStorage(LS_PREFIX_CHECKLIST + report.date, JSON.stringify(cleanedReport));
  if (cleanedReport.isUserModified) {
    propagatedDates = propagateChecklistLocalForward(cleanedReport);
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
        const parsedFut = sanitizeForFirestore(JSON.parse(rawFut) as DailyChecklistReport);
        await setDoc(doc(db, COLLECTION_CHECKLISTS, futDate), parsedFut);
      }
    }

    recordFirebaseWrite(1 + propagatedDates.length, 'Simpan Daily Checklist');
    return { success: true };
  } catch (error) {
    console.error('Firestore saveChecklistReport error, using local fallback:', error);
    return { success: true, isLocalFallback: true };
  }
}

/**
 * Load Daily Checklist Report by Date (prioritizes user-modified data and syncs between Cloud and LocalStorage)
 */
export async function loadChecklistReport(dateStr: string): Promise<DailyChecklistReport | null> {
  if (!dateStr) return null;
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
        recordFirebaseRead(1, 'Baca Daily Checklist');
      }
    } catch (error) {
      console.warn('Firestore loadChecklistReport failed, checking local storage:', error);
    }
  }

  if (cloudReport && localReport) {
    const cloudModified = isChecklistCustomModified(cloudReport);
    const localModified = isChecklistCustomModified(localReport);

    if (cloudModified && !localModified) {
      safeSetLocalStorage(LS_PREFIX_CHECKLIST + dateStr, JSON.stringify(cloudReport));
      return cloudReport;
    }
    if (localModified && !cloudModified) {
      if (db) {
        setDoc(doc(db, COLLECTION_CHECKLISTS, dateStr), sanitizeForFirestore(localReport)).catch(() => {});
      }
      return localReport;
    }

    if ((localReport.updatedAt || 0) >= (cloudReport.updatedAt || 0)) {
      safeSetLocalStorage(LS_PREFIX_CHECKLIST + dateStr, JSON.stringify(localReport));
      if (db && localModified) {
        setDoc(doc(db, COLLECTION_CHECKLISTS, dateStr), sanitizeForFirestore(localReport)).catch(() => {});
      }
      return localReport;
    } else {
      safeSetLocalStorage(LS_PREFIX_CHECKLIST + dateStr, JSON.stringify(cloudReport));
      return cloudReport;
    }
  }

  if (cloudReport) {
    safeSetLocalStorage(LS_PREFIX_CHECKLIST + dateStr, JSON.stringify(cloudReport));
    return cloudReport;
  }

  if (localReport) {
    if (db && isChecklistCustomModified(localReport)) {
      setDoc(doc(db, COLLECTION_CHECKLISTS, dateStr), sanitizeForFirestore(localReport)).catch(() => {});
    }
    return localReport;
  }

  return null;
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

  // 2. Collect from Firestore if online with optimized query (limit 10, order by date desc)
  if (db) {
    try {
      const q = query(
        collection(db, COLLECTION_CHECKLISTS),
        where('date', '<', targetDate),
        orderBy('date', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const d = docSnap.id;
        const cloudData = docSnap.data() as DailyChecklistReport;
        const existing = byDate.get(d);
        if (!existing || (cloudData.updatedAt || 0) > (existing.updatedAt || 0)) {
          byDate.set(d, cloudData);
        }
      });
    } catch {
      // Graceful fallback if indexed query is waiting on index building
      try {
        const fallbackSnap = await getDocs(collection(db, COLLECTION_CHECKLISTS));
        fallbackSnap.forEach((docSnap) => {
          const d = docSnap.id;
          if (d < targetDate) {
            const cloudData = docSnap.data() as DailyChecklistReport;
            const existing = byDate.get(d);
            if (!existing || (cloudData.updatedAt || 0) > (existing.updatedAt || 0)) {
              byDate.set(d, cloudData);
            }
          }
        });
      } catch (err2) {
        console.warn('Could not query previous checklists from Firestore:', err2);
      }
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
 * List all saved report dates (optimized query with 60-day limit)
 */
export async function getSavedReportDates(): Promise<{ activityDates: string[]; checklistDates: string[] }> {
  const activityDates: Set<string> = new Set();
  const checklistDates: Set<string> = new Set();

  if (db) {
    try {
      const actQuery = query(
        collection(db, COLLECTION_ACTIVITIES),
        orderBy('date', 'desc'),
        limit(60)
      );
      const actSnap = await getDocs(actQuery);
      actSnap.forEach((d) => activityDates.add(d.id));
    } catch {
      try {
        const actSnap = await getDocs(collection(db, COLLECTION_ACTIVITIES));
        actSnap.forEach((d) => activityDates.add(d.id));
      } catch (err) {
        console.warn('Could not query activities from Firestore:', err);
      }
    }

    try {
      const checkQuery = query(
        collection(db, COLLECTION_CHECKLISTS),
        orderBy('date', 'desc'),
        limit(60)
      );
      const checkSnap = await getDocs(checkQuery);
      checkSnap.forEach((d) => checklistDates.add(d.id));
    } catch {
      try {
        const checkSnap = await getDocs(collection(db, COLLECTION_CHECKLISTS));
        checkSnap.forEach((d) => checklistDates.add(d.id));
      } catch (err) {
        console.warn('Could not query checklists from Firestore:', err);
      }
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
export async function saveTeamMembersToCloud(members: TeamMember[], updatedAt = Date.now()): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'app_settings', 'team_members');
    await setDoc(docRef, sanitizeForFirestore({
      members,
      updatedAt,
    }));
  } catch (err) {
    console.warn('Could not save team members to Firestore:', err);
  }
}

/**
 * Load IT PIC team members from Firestore
 */
export async function loadTeamMembersFromCloud(): Promise<{ members: TeamMember[]; updatedAt: number } | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'app_settings', 'team_members');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.members)) {
        return {
          members: data.members as TeamMember[],
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
        };
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
export async function saveClientUsersToCloud(users: ClientUser[], updatedAt = Date.now()): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'app_settings', 'client_users');
    await setDoc(docRef, sanitizeForFirestore({
      users,
      updatedAt,
    }));
  } catch (err) {
    console.warn('Could not save client users to Firestore:', err);
  }
}

/**
 * Load Client Users (User / Departemen) from Firestore
 */
export async function loadClientUsersFromCloud(): Promise<{ users: ClientUser[]; updatedAt: number } | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'app_settings', 'client_users');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.users)) {
        return {
          users: data.users as ClientUser[],
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
        };
      }
    }
  } catch (err) {
    console.warn('Could not load client users from Firestore:', err);
  }
  return null;
}

/**
 * Save custom ordered departments list to Firestore
 */
export async function saveDepartmentsToCloud(departments: string[], updatedAt = Date.now()): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'app_settings', 'departments');
    await setDoc(docRef, sanitizeForFirestore({
      departments,
      updatedAt,
    }));
  } catch (err) {
    console.warn('Could not save departments to Firestore:', err);
  }
}

/**
 * Load custom ordered departments list from Firestore
 */
export async function loadDepartmentsFromCloud(): Promise<{ departments: string[]; updatedAt: number } | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'app_settings', 'departments');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data?.departments)) {
        return {
          departments: data.departments as string[],
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
        };
      }
    }
  } catch (err) {
    console.warn('Could not load departments from Firestore:', err);
  }
  return null;
}

/**
 * Subscribe in real-time to changes in Daily Activity Report for a given date
 * (Allows multi-device / multi-user instant synchronization)
 */
export function subscribeToActivityReport(
  dateStr: string,
  onUpdate: (report: DailyActivityReport) => void
): () => void {
  if (!db || !dateStr) return () => {};
  try {
    const docRef = doc(db, COLLECTION_ACTIVITIES, dateStr);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as DailyActivityReport;
          recordFirebaseRead(1, 'Realtime Sync Activity');
          onUpdate(data);
        }
      },
      (error) => {
        console.warn(`Realtime activity sync warning for ${dateStr}:`, error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn(`Failed to set up activity listener for ${dateStr}:`, err);
    return () => {};
  }
}

/**
 * Subscribe in real-time to changes in Daily Checklist Report for a given date
 * (Allows multi-device / multi-user instant synchronization)
 */
export function subscribeToChecklistReport(
  dateStr: string,
  onUpdate: (report: DailyChecklistReport) => void
): () => void {
  if (!db || !dateStr) return () => {};
  try {
    const docRef = doc(db, COLLECTION_CHECKLISTS, dateStr);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as DailyChecklistReport;
          recordFirebaseRead(1, 'Realtime Sync Checklist');
          onUpdate(data);
        }
      },
      (error) => {
        console.warn(`Realtime checklist sync warning for ${dateStr}:`, error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn(`Failed to set up checklist listener for ${dateStr}:`, err);
    return () => {};
  }
}

/**
 * Subscribe in real-time to IT PIC team members changes
 */
export function subscribeToTeamMembers(
  onUpdate: (members: TeamMember[], updatedAt: number) => void
): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'app_settings', 'team_members');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.members)) {
            onUpdate(
              data.members as TeamMember[],
              typeof data.updatedAt === 'number' ? data.updatedAt : 0
            );
          }
        }
      },
      (err) => console.warn('Team members realtime listener warning:', err)
    );
  } catch (err) {
    console.warn('Failed to set up team members listener:', err);
    return () => {};
  }
}

/**
 * Subscribe in real-time to Client Users changes
 */
export function subscribeToClientUsers(
  onUpdate: (users: ClientUser[], updatedAt: number) => void
): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'app_settings', 'client_users');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data?.users)) {
            onUpdate(
              data.users as ClientUser[],
              typeof data.updatedAt === 'number' ? data.updatedAt : 0
            );
          }
        }
      },
      (err) => console.warn('Client users realtime listener warning:', err)
    );
  } catch (err) {
    console.warn('Failed to set up client users listener:', err);
    return () => {};
  }
}

/**
 * Subscribe in real-time to custom App Logo changes
 */
export function subscribeToAppLogo(
  onUpdate: (logoUrl: string | null) => void
): () => void {
  if (!db) return () => {};
  try {
    const docRef = doc(db, 'app_settings', 'company_logo');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate(data?.logoUrl || null);
        }
      },
      (err) => console.warn('App logo realtime listener warning:', err)
    );
  } catch (err) {
    console.warn('Failed to set up app logo listener:', err);
    return () => {};
  }
}

/**
 * Synchronizes any user-modified reports in LocalStorage with Cloud Firestore
 * Ensures that if a user uploaded photos or filled forms while briefly offline or before a reload,
 * their data is automatically pushed to Firestore.
 */
export async function syncPendingLocalReportsToCloud(): Promise<number> {
  if (!db) return 0;
  let syncedCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(LS_PREFIX_ACTIVITY)) {
        const dateStr = key.replace(LS_PREFIX_ACTIVITY, '');
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const localAct = JSON.parse(raw) as DailyActivityReport;
          if (isActivityCustomModified(localAct)) {
            const docRef = doc(db, COLLECTION_ACTIVITIES, dateStr);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
              await setDoc(docRef, sanitizeForFirestore(localAct));
              syncedCount++;
            } else {
              const cloudAct = snap.data() as DailyActivityReport;
              if (
                !isActivityCustomModified(cloudAct) ||
                (localAct.updatedAt || 0) > (cloudAct.updatedAt || 0)
              ) {
                await setDoc(docRef, sanitizeForFirestore(localAct));
                syncedCount++;
              }
            }
          }
        } catch {
          // ignore invalid JSON
        }
      } else if (key.startsWith(LS_PREFIX_CHECKLIST)) {
        const dateStr = key.replace(LS_PREFIX_CHECKLIST, '');
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const localCheck = JSON.parse(raw) as DailyChecklistReport;
          if (isChecklistCustomModified(localCheck)) {
            const docRef = doc(db, COLLECTION_CHECKLISTS, dateStr);
            const snap = await getDoc(docRef);
            if (!snap.exists()) {
              await setDoc(docRef, sanitizeForFirestore(localCheck));
              syncedCount++;
            } else {
              const cloudCheck = snap.data() as DailyChecklistReport;
              if (
                !isChecklistCustomModified(cloudCheck) ||
                (localCheck.updatedAt || 0) > (cloudCheck.updatedAt || 0)
              ) {
                await setDoc(docRef, sanitizeForFirestore(localCheck));
                syncedCount++;
              }
            }
          }
        } catch {
          // ignore invalid JSON
        }
      }
    }
  } catch (err) {
    console.warn('Background cloud sync warning:', err);
  }

  return syncedCount;
}


