/**
 * Quota & Resource Usage Tracker for Firebase Firestore and Vercel Deployment
 * Tracks real-time operations, daily consumption, and remaining quotas against Free Tier limits.
 */

export interface FirebaseQuotaLimits {
  dailyReads: number;
  dailyWrites: number;
  dailyDeletes: number;
  storageMb: number;
  simultaneousConnections: number;
}

export interface VercelQuotaLimits {
  dailyDeployments: number;
  monthlyBandwidthGb: number;
  dailyEstimatedRequests: number;
  monthlyEdgeRequests: number;
  serverlessExecutionGbHours: number;
}

export const FIREBASE_SPARK_LIMITS: FirebaseQuotaLimits = {
  dailyReads: 50000,     // 50,000 document reads/day
  dailyWrites: 20000,    // 20,000 document writes/day
  dailyDeletes: 20000,   // 20,000 document deletes/day
  storageMb: 1024,       // 1 GB total stored data
  simultaneousConnections: 100,
};

export const VERCEL_HOBBY_LIMITS: VercelQuotaLimits = {
  dailyDeployments: 100,        // 100 deployments/day
  monthlyBandwidthGb: 100,      // 100 GB Fast Data Transfer / month
  dailyEstimatedRequests: 16600, // ~500k/30 days
  monthlyEdgeRequests: 500000,  // 500,000 Edge Requests / month
  serverlessExecutionGbHours: 100,
};

export interface QuotaDailyStats {
  date: string; // YYYY-MM-DD
  firebaseReads: number;
  firebaseWrites: number;
  firebaseDeletes: number;
  vercelRequests: number;
  vercelDeployments: number;
  lastActiveTimestamp: number;
  lastOperation: string;
}

const STORAGE_KEY = 'itbg_quota_daily_stats_v2';

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function loadStoredStats(): QuotaDailyStats {
  const today = getTodayString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuotaDailyStats;
      if (parsed.date === today) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('QuotaTracker load warning:', e);
  }

  // Initial stats for new day
  return {
    date: today,
    firebaseReads: 4,      // Baseline count from initial session loads
    firebaseWrites: 1,     // Baseline from initial state check
    firebaseDeletes: 0,
    vercelRequests: 12,    // Initial static assets + page load requests
    vercelDeployments: 1,
    lastActiveTimestamp: Date.now(),
    lastOperation: 'Session initialized',
  };
}

let currentStats: QuotaDailyStats = loadStoredStats();
const listeners = new Set<(stats: QuotaDailyStats) => void>();

function persistAndNotify(opDescription?: string): void {
  const today = getTodayString();
  if (currentStats.date !== today) {
    currentStats = {
      date: today,
      firebaseReads: 1,
      firebaseWrites: 0,
      firebaseDeletes: 0,
      vercelRequests: 1,
      vercelDeployments: 1,
      lastActiveTimestamp: Date.now(),
      lastOperation: opDescription || 'New day initialized',
    };
  } else {
    currentStats.lastActiveTimestamp = Date.now();
    if (opDescription) {
      currentStats.lastOperation = opDescription;
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStats));
  } catch {
    // ignore quota error on local storage
  }

  listeners.forEach((fn) => {
    try {
      fn({ ...currentStats });
    } catch (err) {
      console.warn('Listener error in QuotaTracker:', err);
    }
  });
}

export function subscribeQuotaStats(callback: (stats: QuotaDailyStats) => void): () => void {
  listeners.add(callback);
  callback({ ...currentStats });
  return () => {
    listeners.delete(callback);
  };
}

export function getQuotaStats(): QuotaDailyStats {
  return { ...currentStats };
}

export function recordFirebaseRead(count = 1, desc = 'Read document'): void {
  currentStats.firebaseReads += Math.max(1, count);
  currentStats.vercelRequests += 1;
  persistAndNotify(`Firebase: ${desc} (+${count})`);
}

export function recordFirebaseWrite(count = 1, desc = 'Write/Save document'): void {
  currentStats.firebaseWrites += Math.max(1, count);
  currentStats.vercelRequests += 1;
  persistAndNotify(`Firebase: ${desc} (+${count})`);
}

export function recordFirebaseDelete(count = 1, desc = 'Delete document'): void {
  currentStats.firebaseDeletes += Math.max(1, count);
  persistAndNotify(`Firebase: ${desc} (+${count})`);
}

export function recordVercelRequest(count = 1, desc = 'Asset / Page Request'): void {
  currentStats.vercelRequests += Math.max(1, count);
  persistAndNotify(`Vercel: ${desc} (+${count})`);
}

/**
 * Estimate local + cloud storage utilized by current documents
 */
export function estimateCurrentStorage(): { totalBytes: number; formattedSize: string; documentCount: number } {
  let bytes = 0;
  let docCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('ciputra_act_') || k.startsWith('ciputra_check_') || k.startsWith('itbg_'))) {
        const val = localStorage.getItem(k) || '';
        bytes += (k.length + val.length) * 2; // UTF-16 bytes approx
        docCount++;
      }
    }
  } catch {
    // ignore
  }

  // Base overhead for Firestore indexes & configuration
  const totalBytes = bytes + 250000; // ~250KB base
  const kb = totalBytes / 1024;
  const mb = kb / 1024;

  const formattedSize = mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
  return {
    totalBytes,
    formattedSize,
    documentCount: Math.max(1, docCount),
  };
}
