import { getLogger } from "@app/logger";
import { useCallback, useMemo, useRef } from "react";
import useDb from "use-db";

const logger = getLogger(["calca", "web", "design", "persist"]);

import type { CanvasImage } from "#/shared/types";

const MAX_IMAGES = 20;

/** Compress an image dataUrl to JPEG at reduced quality/size for storage */
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
    img.onerror = () => resolve(dataUrl); // Fallback to original
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

export function usePersistedImages() {
  const [storedImages, setStoredImages] = useDb<StoredImage[]>("canvas-images", {
    defaultValue: [],
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transform StoredImage[] to CanvasImage[] - computed from storedImages
  const images = useMemo<CanvasImage[]>(
    () =>
      storedImages.map((s) => ({
        dataUrl: s.compressedDataUrl,
        height: s.height,
        id: s.id,
        name: s.name,
        position: s.position,
        thumbnail: s.thumbnail,
        width: s.width,
      })),
    [storedImages],
  );

  // Track loaded state - if storedImages has values beyond default, it's loaded
  // useDb uses useSyncExternalStore so data is available synchronously
  const loaded = storedImages.length > 0;

  // Debounced save to IndexedDB via useDb
  const persistImages = useCallback(
    async (newImages: CanvasImage[]) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(async () => {
        try {
          // Compress images for storage (max 800px wide, JPEG 60%)
          const toStore: StoredImage[] = await Promise.all(
            newImages.slice(0, MAX_IMAGES).map(async (img) => ({
              compressedDataUrl: await compressForStorage(img.dataUrl),
              height: img.height,
              id: img.id,
              name: img.name,
              position: img.position,
              thumbnail: img.thumbnail,
              width: img.width,
            })),
          );
          setStoredImages(toStore);
        } catch (error) {
          logger.debug("Failed to save canvas images", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }, 500);
    },
    [setStoredImages],
  );

  const setImages = useCallback(
    (updater: CanvasImage[] | ((prev: CanvasImage[]) => CanvasImage[])) => {
      // Compute next images from current storedImages to maintain consistency
      setStoredImages((prev: StoredImage[]) => {
        const currentCanvasImages = prev.map((s) => ({
          dataUrl: s.compressedDataUrl,
          height: s.height,
          id: s.id,
          name: s.name,
          position: s.position,
          thumbnail: s.thumbnail,
          width: s.width,
        }));
        const next =
          typeof updater === "function" ? updater(currentCanvasImages) : updater;
        persistImages(next);
        return prev; // Return same - persistImages handles async update separately
      });
    },
    [persistImages, setStoredImages],
  );

  return { images, loaded, setImages };
}
