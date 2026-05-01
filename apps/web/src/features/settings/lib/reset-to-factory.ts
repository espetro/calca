/**
 * Resets all Calca local state (localStorage + IndexedDB) back to factory defaults.
 *
 * - Clears all localStorage keys prefixed with "calca-"
 * - Deletes all IndexedDB databases prefixed with "calca-"
 * - Does NOT call any server-side APIs
 * - Does NOT clear cookies or sessionStorage
 *
 * @returns true if all operations completed without catching errors; false otherwise.
 */
export async function resetToFactory(): Promise<boolean> {
  let allSucceeded = true;

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) keys.push(key);
    }
    for (const key of keys) {
      if (key.startsWith("calca")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    allSucceeded = false;
  }

  try {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name?.startsWith("calca")) {
        try {
          await new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        } catch {
          allSucceeded = false;
        }
      }
    }
  } catch {
    allSucceeded = false;
  }

  return allSucceeded;
}
