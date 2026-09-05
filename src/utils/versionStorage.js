/**
 * src/utils/versionStorage.js
 *
 * Pure JavaScript, zero-dependency IndexedDB wrapper for named CV snapshots.
 * Persists version metadata, thumbnails, and complete cvData snapshots across browser sessions.
 * 100% decoupled from localStorage['cvData'].
 * Includes transparent in-memory Map fallback when indexedDB is undefined/unavailable.
 */

const DB_NAME = 'RessumeDB';
const DB_VERSION = 1;
const STORE_NAME = 'versions';

// In-memory Map fallback for runtimes without IndexedDB (e.g. Node, SSR, headless Vitest/jsdom)
const memoryStore = new Map();

/**
 * Deep clone utility using structuredClone with JSON fallback.
 * Prevents in-memory mutations across state references.
 *
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  if (obj === undefined) return undefined;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // structuredClone can throw on DOM nodes or certain proxies; fall back to JSON
    }
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a collision-resistant unique identifier.
 *
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to fallback
    }
  }
  return `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect available indexedDB instance in global/window scope.
 *
 * @returns {IDBFactory|null}
 */
function getIndexedDB() {
  if (typeof indexedDB !== 'undefined') return indexedDB;
  if (typeof window !== 'undefined' && window.indexedDB) return window.indexedDB;
  if (typeof globalThis !== 'undefined' && globalThis.indexedDB) return globalThis.indexedDB;
  return null;
}

let lastIDB = null;
let dbInstancePromise = null;

/**
 * Open or initialize the IndexedDB database.
 * Resolves with IDBDatabase instance, or null if IndexedDB is not supported/failed.
 *
 * @returns {Promise<IDBDatabase|null>}
 */
function openDB() {
  const idb = getIndexedDB();
  if (!idb) {
    dbInstancePromise = null;
    lastIDB = null;
    return Promise.resolve(null);
  }

  if (lastIDB !== idb) {
    dbInstancePromise = null;
    lastIDB = idb;
  }

  if (!dbInstancePromise) {
    dbInstancePromise = new Promise((resolve) => {
      try {
        const request = idb.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const hasStore = typeof db.objectStoreNames?.contains === 'function'
            ? db.objectStoreNames.contains(STORE_NAME)
            : Array.from(db.objectStoreNames || []).includes(STORE_NAME);
          if (!hasStore) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('name', 'name', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          const db = event.target.result;
          db.onversionchange = () => {
            db.close();
            dbInstancePromise = null;
          };
          resolve(db);
        };

        request.onerror = (event) => {
          console.warn('IndexedDB open error, falling back to memory store:', event?.target?.error);
          resolve(null);
        };

        request.onblocked = () => {
          console.warn('IndexedDB open blocked by another connection');
        };
      } catch (err) {
        console.warn('IndexedDB open threw exception, falling back to memory store:', err);
        resolve(null);
      }
    });
  }

  return dbInstancePromise;
}

/**
 * Save a new named version snapshot of the CV.
 *
 * @param {string} name - Version display name.
 * @param {object} cvData - CV data object to snapshot.
 * @param {string} [thumbnail=null] - Visual thumbnail data URL.
 * @returns {Promise<{id: string, name: string, createdAt: string, updatedAt: string, thumbnail: string|null, cvData: object}>}
 */
export async function saveVersion(name, cvData, thumbnail = null) {
  const id = generateId();
  const now = new Date().toISOString();
  const trimmedName = typeof name === 'string' && name.trim() ? name.trim() : 'Versión sin nombre';
  const clonedData = deepClone(cvData);

  const versionRecord = {
    id,
    name: trimmedName,
    createdAt: now,
    updatedAt: now,
    thumbnail: thumbnail || null,
    cvData: clonedData,
  };

  const db = await openDB();
  if (!db) {
    memoryStore.set(id, deepClone(versionRecord));
    return deepClone(versionRecord);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(versionRecord);

      request.onsuccess = () => {
        resolve(deepClone(versionRecord));
      };

      request.onerror = () => {
        // Fallback to memory store if IDB write fails
        memoryStore.set(id, deepClone(versionRecord));
        resolve(deepClone(versionRecord));
      };
    } catch (err) {
      memoryStore.set(id, deepClone(versionRecord));
      resolve(deepClone(versionRecord));
    }
  });
}

/**
 * Retrieve all saved versions, sorted descending by createdAt.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getAllVersions() {
  const db = await openDB();
  if (!db) {
    const list = Array.from(memoryStore.values()).map((v) => deepClone(v));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result || []).map((v) => deepClone(v));
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };

      request.onerror = () => {
        const list = Array.from(memoryStore.values()).map((v) => deepClone(v));
        resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      };
    } catch (err) {
      const list = Array.from(memoryStore.values()).map((v) => deepClone(v));
      resolve(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  });
}

/**
 * Retrieve a specific version by its ID.
 *
 * @param {string} id - Version ID.
 * @returns {Promise<object|null>}
 */
export async function getVersion(id) {
  if (!id) return null;

  const db = await openDB();
  if (!db) {
    const found = memoryStore.get(id);
    return found ? deepClone(found) : null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve(deepClone(request.result));
        } else {
          const mem = memoryStore.get(id);
          resolve(mem ? deepClone(mem) : null);
        }
      };

      request.onerror = () => {
        const found = memoryStore.get(id);
        resolve(found ? deepClone(found) : null);
      };
    } catch (err) {
      const found = memoryStore.get(id);
      resolve(found ? deepClone(found) : null);
    }
  });
}

/**
 * Rename an existing version and update its updatedAt timestamp.
 *
 * @param {string} id - Version ID.
 * @param {string} newName - New version name.
 * @returns {Promise<object>}
 */
export async function renameVersion(id, newName) {
  if (!id) throw new Error('Cannot rename version: Missing ID');
  const trimmedName = typeof newName === 'string' && newName.trim() ? newName.trim() : 'Versión sin nombre';

  const existing = await getVersion(id);
  if (!existing) {
    throw new Error(`Version not found: ${id}`);
  }

  existing.name = trimmedName;
  existing.updatedAt = new Date().toISOString();

  const db = await openDB();
  if (!db) {
    memoryStore.set(id, deepClone(existing));
    return deepClone(existing);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(existing);

      request.onsuccess = () => {
        memoryStore.set(id, deepClone(existing));
        resolve(deepClone(existing));
      };

      request.onerror = () => {
        memoryStore.set(id, deepClone(existing));
        resolve(deepClone(existing));
      };
    } catch (err) {
      memoryStore.set(id, deepClone(existing));
      resolve(deepClone(existing));
    }
  });
}

/**
 * Remove a version from storage by its ID.
 *
 * @param {string} id - Version ID.
 * @returns {Promise<boolean>}
 */
export async function deleteVersion(id) {
  if (!id) return false;

  const existing = await getVersion(id);
  if (!existing) return false;

  memoryStore.delete(id);
  const db = await openDB();

  if (!db) {
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        resolve(true);
      };
    } catch (err) {
      resolve(true);
    }
  });
}

/**
 * Duplicate an existing version with a new ID, updated timestamps, and a copy name.
 *
 * @param {string} id - Source version ID to clone.
 * @param {string} [newName] - Optional custom name for duplicate. Defaults to "Copia de [name]".
 * @returns {Promise<object>}
 */
export async function duplicateVersion(id, newName) {
  if (!id) throw new Error('Cannot duplicate version: Missing ID');

  const original = await getVersion(id);
  if (!original) {
    throw new Error(`Version not found: ${id}`);
  }

  const defaultCopyName = `Copia de ${original.name}`;
  const duplicateName = typeof newName === 'string' && newName.trim() ? newName.trim() : defaultCopyName;

  return await saveVersion(duplicateName, original.cvData, original.thumbnail);
}

/**
 * Clear all stored versions (for testing and reset operations).
 *
 * @returns {Promise<boolean>}
 */
export async function clearAllVersions() {
  memoryStore.clear();
  const db = await openDB();
  if (!db) return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(true);
    } catch {
      resolve(true);
    }
  });
}

export default {
  saveVersion,
  getAllVersions,
  getVersion,
  renameVersion,
  deleteVersion,
  duplicateVersion,
  clearAllVersions,
  deepClone,
};
