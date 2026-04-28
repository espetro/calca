import { getLogger } from "@app/logger";
import { useCallback, useRef, useState } from "react";
import useDb from "use-db";

import { useMountEffect } from "#/shared/utils/use-mount-effect";

const logger = getLogger(["calca", "web", "design", "persist"]);

import type { GenerationGroup } from "#/shared/types";

const STORAGE_KEY = "calca-canvas-session";

/** Strip base64 data URIs, storing them in IndexedDB keyed by hash */
function extractBase64(groups: GenerationGroup[]): {
  stripped: GenerationGroup[];
  images: Record<string, string>;
} {
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
  return { images, stripped };
}

/** Restore base64 from IndexedDB refs */
function restoreBase64(
  groups: GenerationGroup[],
  images: Record<string, string>,
): GenerationGroup[] {
  return groups.map((g) => ({
    ...g,
    iterations: g.iterations.map((it) => ({
      ...it,
      html: it.html
        ? it.html.replace(/src="\[idb:([^\]]+)\]"/g, (_m, key) =>
            images[key] ? `src="${images[key]}"` : 'src="[img-missing]"',
          )
        : it.html,
    })),
  }));
}

export function usePersistedGroups() {
  const [groups, setGroupsRaw] = useState<GenerationGroup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blob store for base64 images - useDb handles async loading via useSyncExternalStore
  const [blobStore, setBlobStore] = useDb<Record<string, string>>("canvas-images-blobs", {
    defaultValue: {},
  });

  // Load from localStorage + blob store on mount
  useMountEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as GenerationGroup[];
          const valid = parsed.filter((g) => g.iterations.some((it) => it.html && !it.isLoading));
          if (valid.length > 0) {
            // Restore base64 images from blob store
            try {
              setGroupsRaw(restoreBase64(valid, blobStore));
            } catch {
              setGroupsRaw(valid);
            }
          }
        }
      } catch {}
      setLoaded(true);
    })();
  });

  // Debounced save to localStorage + blob store
  const persistGroups = useCallback(
    (newGroups: GenerationGroup[]) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      saveTimer.current = setTimeout(() => {
        try {
          // Only save groups that have real content
          const toSave = newGroups.filter((g) =>
            g.iterations.some((it) => it.html && !it.isLoading),
          );
          // Extract base64 images to blob store, store lightweight HTML in localStorage
          const { stripped, images } = extractBase64(toSave);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
          if (Object.keys(images).length > 0) {
            setBlobStore((prev) => ({ ...prev, ...images }));
          }
        } catch (error) {
          logger.debug("Failed to save canvas session", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }, 500);
    },
    [setBlobStore],
  );

  // Wrapper that persists on every change
  const setGroups = useCallback(
    (updater: GenerationGroup[] | ((prev: GenerationGroup[]) => GenerationGroup[])) => {
      setGroupsRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        persistGroups(next);
        return next;
      });
    },
    [persistGroups],
  );

  const resetSession = useCallback(() => {
    setGroupsRaw([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { groups, loaded, resetSession, setGroups };
}
