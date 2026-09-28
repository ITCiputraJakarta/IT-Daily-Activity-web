/**
 * High-capacity IndexedDB storage for Daily Activity & Daily Checklist reports.
 * Solves browser localStorage 5MB quota limits when storing multiple base64 photos.
 */

const DB_NAME = 'hcj_it_reports_db';
const DB_VERSION = 1;
const STORE_ACTIVITIES = 'daily_activities';
const STORE_CHECKLISTS = 'daily_checklists';

function openReportsDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
          db.createObjectStore(STORE_ACTIVITIES, { keyPath: 'date' });
        }
        if (!db.objectStoreNames.contains(STORE_CHECKLISTS)) {
          db.createObjectStore(STORE_CHECKLISTS, { keyPath: 'date' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('IndexedDB open warning:', request.error);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB exception:', e);
      resolve(null);
    }
  });
}

export async function idbSaveActivity<T extends { date: string }>(report: T): Promise<boolean> {
  const db = await openReportsDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_ACTIVITIES, 'readwrite');
      const store = tx.objectStore(STORE_ACTIVITIES);
      store.put(report);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function idbLoadActivity<T>(dateStr: string): Promise<T | null> {
  const db = await openReportsDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_ACTIVITIES, 'readonly');
      const store = tx.objectStore(STORE_ACTIVITIES);
      const req = store.get(dateStr);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T) || null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function idbGetAllActivities<T>(): Promise<T[]> {
  const db = await openReportsDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_ACTIVITIES, 'readonly');
      const store = tx.objectStore(STORE_ACTIVITIES);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T[]) || []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

export async function idbDeleteActivity(dateStr: string): Promise<void> {
  const db = await openReportsDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_ACTIVITIES, 'readwrite');
      tx.objectStore(STORE_ACTIVITIES).delete(dateStr);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function idbSaveChecklist<T extends { date: string }>(report: T): Promise<boolean> {
  const db = await openReportsDb();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHECKLISTS, 'readwrite');
      const store = tx.objectStore(STORE_CHECKLISTS);
      store.put(report);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function idbLoadChecklist<T>(dateStr: string): Promise<T | null> {
  const db = await openReportsDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHECKLISTS, 'readonly');
      const store = tx.objectStore(STORE_CHECKLISTS);
      const req = store.get(dateStr);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T) || null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function idbGetAllChecklists<T>(): Promise<T[]> {
  const db = await openReportsDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHECKLISTS, 'readonly');
      const store = tx.objectStore(STORE_CHECKLISTS);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        resolve((req.result as T[]) || []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

export async function idbDeleteChecklist(dateStr: string): Promise<void> {
  const db = await openReportsDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHECKLISTS, 'readwrite');
      tx.objectStore(STORE_CHECKLISTS).delete(dateStr);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
