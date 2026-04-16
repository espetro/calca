import { atom } from "jotai";
import type { GenerationGroup } from "@/shared/types";

const STORAGE_KEY = "otto-canvas-session";
const IMG_DB_NAME = "otto-canvas-images";
const IMG_STORE = "images";

function openImgDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IMG_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IMG_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveImagesToIDB(images: Record<string, string>): Promise<void> {
  const db = await openImgDB();
  const tx = db.transaction(IMG_STORE, "readwrite");
  const store = tx.objectStore(IMG_STORE);
  for (const [key, val] of Object.entries(images)) {
    store.put(val, key);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function loadImagesFromIDB(): Promise<Record<string, string>> {
  const db = await openImgDB();
  const tx = db.transaction(IMG_STORE, "readonly");
  const store = tx.objectStore(IMG_STORE);
  const result: Record<string, string> = {};
  return new Promise((resolve, reject) => {
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) { result[c.key as string] = c.value; c.continue(); }
      else { db.close(); resolve(result); }
    };
    cursor.onerror = () => { db.close(); reject(cursor.error); };
  });
}

// Regex `src="(data:image/...)"` → `[idb:key]` placeholder for IndexedDB offloading
function extractBase64(groups: GenerationGroup[]): { stripped: GenerationGroup[]; images: Record<string, string> } {
  const images: Record<string, string> = {};
  let counter = 0;
  const stripped = groups.map((g) => ({
    ...g,
    iterations: g.iterations.map((it) => ({
      ...it,
      html: it.html
        ? it.html.replace(/src="(data:image\/[^"]+)"/g, (_m, uri) => {
            const key = `img_${g.id}_${it.id}_${counter++}`;
            images[key] = uri;
            return `src="[idb:${key}]"`;
          })
        : it.html,
    })),
  }));
  return { stripped, images };
}

function restoreBase64(groups: GenerationGroup[], images: Record<string, string>): GenerationGroup[] {
  return groups.map((g) => ({
    ...g,
    iterations: g.iterations.map((it) => ({
      ...it,
      html: it.html
        ? it.html.replace(/src="\[idb:([^\]]+)\]"/g, (_m, key) => {
            return images[key] ? `src="${images[key]}"` : 'src="[img-missing]"';
          })
        : it.html,
    })),
  }));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedPersist(groups: GenerationGroup[]): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const toSave = groups.filter((g) =>
        g.iterations.some((it) => it.html && !it.isLoading)
      );
      const { stripped, images } = extractBase64(toSave);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
      if (Object.keys(images).length > 0) {
        saveImagesToIDB(images).catch((err) =>
          console.warn("[persist] Failed to save images to IndexedDB:", err)
        );
      }
    } catch (err) {
      console.warn("[persist] Failed to save canvas session:", err);
    }
  }, 500);
}

const _groupsBase = atom<GenerationGroup[]>([]);

export const groupsAtom = atom(
  (get: { (a: typeof _groupsBase): GenerationGroup[] }) => get(_groupsBase),
  (_get: unknown, set: (a: typeof _groupsBase, v: GenerationGroup[] | ((p: GenerationGroup[]) => GenerationGroup[])) => void, update: GenerationGroup[] | ((prev: GenerationGroup[]) => GenerationGroup[])) => {
    set(_groupsBase, (prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      debouncedPersist(next);
      return next;
    });
  },
);

export const resetSessionAtom = atom(null, (_get: unknown, set: (a: typeof groupsAtom, v: GenerationGroup[]) => void) => {
  set(groupsAtom, []);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
});

export async function hydrateGroups(setGroups: (g: GenerationGroup[]) => void): Promise<void> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GenerationGroup[];
      const valid = parsed.filter((g) =>
        g.iterations.some((it) => it.html && !it.isLoading)
      );
      if (valid.length > 0) {
        try {
          const images = await loadImagesFromIDB();
          setGroups(restoreBase64(valid, images));
        } catch {
          setGroups(valid);
        }
        return;
      }
    }
  } catch {}
}
