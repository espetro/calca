import { useEffect, useState } from "react";

export interface IndexedDBInitOptions {
  name: string;
  version: number;
  handleUpgradeNeeded?: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null;
}

const init = ({ name, version, handleUpgradeNeeded }: IndexedDBInitOptions) =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded =
      handleUpgradeNeeded ??
      function  onupgradeneeded(this) {
        const db = this.result;
        db.createObjectStore(name);
      };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

interface Props extends IndexedDBInitOptions {}

const useIndexedDB = ({ name, ...initOptions }: Props) => {
  const [db, setDb] = useState<IDBDatabase | undefined>();

  useEffect(() => {
    const initDb = async () => {
      const instance = await init({ ...initOptions, name });
      setDb(instance);
    };

    initDb();
  }, [initOptions]);

  const get = <T>(key: string) =>
    new Promise<T | undefined>((resolve, reject) => {
      if (!db) {
        return reject("DB is not initialized yet!");
      }

      const tx = db.transaction(name, "readonly");
      const req = tx.objectStore(name).get(key);

      req.onsuccess = () => resolve(req?.result);
      req.onerror = () => reject(req?.error);
    });

  const put = (key: string, value: unknown) =>
    new Promise<void>((resolve, reject) => {
      if (!db) {
        return reject("DB is not initialized yet!");
      }

      const tx = db.transaction(name, "readwrite");
      const store = tx.objectStore(name);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

  return { get, put };
};

export default useIndexedDB;
