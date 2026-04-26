import { atom } from "jotai";
import { getLogger } from "@app/logger";

const logger = getLogger(["calca", "web", "design", "persist"]);

import type { CanvasImage } from "@/shared/types";

const DB_NAME = "calca-canvas-images";
const STORE_NAME = "ref-images";
const DB_VERSION = 2;
const MAX_IMAGES = 20;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function compressForStorage(dataUrl: string, maxWidth: number = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface StoredImage {
  id: string;
  compressedDataUrl: string;
  name: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  thumbnail: string;
}

const _imagesBase = atom<CanvasImage[]>([]);

// Every write triggers debounced IndexedDB persistence with JPEG compression
export const canvasImagesAtom = atom(
  (get: { (a: typeof _imagesBase): CanvasImage[] }) => get(_imagesBase),
  (_get: unknown, set: (a: typeof _imagesBase, v: CanvasImage[] | ((p: CanvasImage[]) => CanvasImage[])) => void, update: CanvasImage[] | ((prev: CanvasImage[]) => CanvasImage[])) => {
    set(_imagesBase, (prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      debouncedPersistImages(next);
      return next;
    });
  },
);

let imagesSaveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedPersistImages(images: CanvasImage[]): void {
  if (imagesSaveTimer) clearTimeout(imagesSaveTimer);
  imagesSaveTimer = setTimeout(async () => {
    try {
      const db = await openDB();
      const stored: StoredImage[] = await Promise.all(
        images.slice(0, MAX_IMAGES).map(async (img) => ({
          id: img.id,
          compressedDataUrl: await compressForStorage(img.dataUrl),
          name: img.name,
          width: img.width,
          height: img.height,
          position: img.position,
          thumbnail: img.thumbnail,
        }))
      );
      await dbPut(db, "canvas-images", stored);
    } catch (err) {
      logger.debug("Failed to save canvas images", { error: err instanceof Error ? err.message : String(err) });
    }
  }, 500);
}

export async function hydrateImages(setImages: (imgs: CanvasImage[]) => void): Promise<void> {
  try {
    const db = await openDB();
    const stored = await dbGet<StoredImage[]>(db, "canvas-images");
    if (stored && stored.length > 0) {
      setImages(stored.map((s) => ({
        id: s.id,
        dataUrl: s.compressedDataUrl,
        name: s.name,
        width: s.width,
        height: s.height,
        position: s.position,
        thumbnail: s.thumbnail,
      })));
    }
  } catch (err) {
    logger.debug("Failed to load canvas images", { error: err instanceof Error ? err.message : String(err) });
  }
}
