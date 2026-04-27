/**
 * Canvas session import/export module.
 *
 * Export format: `.design` (JSON-based)
 * Import format: both `.otto` (legacy) and `.design` for backward compatibility.
 */

import { getLogger } from "@app/logger";

const logger = getLogger(["calca", "web", "export"]);

import type { GenerationGroup } from "@/shared/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** File extension for new exports */
export const DESIGN_EXTENSION = ".design" as const;

/** File extensions accepted for import (order matters for detection) */
export const IMPORT_EXTENSIONS = [".otto", ".design"] as const;

/** MIME type for design files */
export const DESIGN_MIME_TYPE = "application/json" as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SerializedCanvas {
  version: number;
  exportedAt: string;
  groups: SerializedGroup[];
}

interface SerializedGroup {
  id: string;
  prompt: string;
  position: { x: number; y: number };
  createdAt: number;
  iterations: SerializedIteration[];
}

interface SerializedIteration {
  id: string;
  label: string;
  html: string;
  width: number;
  height: number;
  position: { x: number; y: number };
}

export interface DeserializedCanvas {
  groups: GenerationGroup[];
  isLegacyOtto: boolean;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serialize canvas groups for export.
 * Strips runtime-only fields like isLoading, isRegenerating.
 */
export function serializeCanvasForExport(groups: GenerationGroup[]): SerializedCanvas {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    groups: groups.map((g) => ({
      id: g.id,
      prompt: g.prompt,
      position: g.position,
      createdAt: g.createdAt,
      iterations: g.iterations.map((iter) => ({
        id: iter.id,
        label: iter.label,
        html: iter.html,
        width: iter.width,
        height: iter.height,
        position: iter.position,
      })),
    })),
  };
}

/** Create a JSON Blob for the given canvas data */
export function createCanvasBlob(groups: GenerationGroup[]): Blob {
  const data = serializeCanvasForExport(groups);
  return new Blob([JSON.stringify(data, null, 2)], { type: DESIGN_MIME_TYPE });
}

/** Generate export filename */
export function generateExportFilename(): string {
  return `canvas-${Date.now()}${DESIGN_EXTENSION}`;
}

// ---------------------------------------------------------------------------
// Deserialization
// ---------------------------------------------------------------------------

/**
 * Validate and deserialize a parsed JSON file.
 * Accepts both legacy `.otto` and new `.design` formats.
 * Returns the groups array or throws on invalid data.
 */
export function deserializeCanvasFile(data: unknown): DeserializedCanvas {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid file: not an object");
  }

  const obj = data as Record<string, unknown>;

  // Legacy .otto files have no version field and a different structure
  const isLegacyOtto = obj.version === undefined;

  if (!obj.groups || !Array.isArray(obj.groups)) {
    throw new Error(
      isLegacyOtto
        ? "Invalid .otto file: missing groups array"
        : "Invalid .design file: missing groups array",
    );
  }

  const groups: GenerationGroup[] = (obj.groups as Record<string, unknown>[]).map(
    (g: Record<string, unknown>, groupIndex: number) => {
      const now = Date.now();
      const groupId = (g.id as string) || `imported-group-${now}-${groupIndex}`;

      return {
        id: groupId,
        prompt: (g.prompt as string) || "",
        position: (g.position as { x: number; y: number }) || { x: 0, y: 0 },
        createdAt: (g.createdAt as number) || now,
        iterations: ((g.iterations as Record<string, unknown>[]) || []).map(
          (iter: Record<string, unknown>, iterIndex: number) => ({
            id: (iter.id as string) || `imported-iter-${now}-${groupIndex}-${iterIndex}`,
            html: (iter.html as string) || "",
            label: (iter.label as string) || "Imported",
            position: (iter.position as { x: number; y: number }) || { x: 0, y: 0 },
            width: (iter.width as number) || 600,
            height: (iter.height as number) || 400,
            prompt: (iter.prompt as string) || (g.prompt as string) || "",
            comments: (iter.comments as never[]) || [],
            isLoading: false,
            isRegenerating: false,
          }),
        ),
      };
    },
  );

  return { groups, isLegacyOtto };
}

/**
 * Read a File and deserialize its contents as canvas data.
 * Detects format (`.otto` vs `.design`) by file extension for error messaging.
 */
export async function readCanvasFile(file: File): Promise<DeserializedCanvas> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  // Detect format for error messages
  const fileName = file.name.toLowerCase();
  const isOttoFile = fileName.endsWith(".otto");

  try {
    const result = deserializeCanvasFile(parsed);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    throw new Error(
      isOttoFile
        ? `Failed to parse .otto file: ${message}`
        : `Failed to parse .design file: ${message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Download trigger
// ---------------------------------------------------------------------------

/** Trigger browser download of a canvas blob */
export function downloadCanvasBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export canvas groups as a .design file */
export function exportCanvas(groups: GenerationGroup[]): void {
  const blob = createCanvasBlob(groups);
  const filename = generateExportFilename();
  downloadCanvasBlob(blob, filename);
}

// ---------------------------------------------------------------------------
// File input factory
// ---------------------------------------------------------------------------

/**
 * Create a hidden file input that accepts both .otto and .design files.
 * Calls `onFile` with the deserialized groups on successful read.
 * Shows an alert on error.
 */
export function openImportDialog(onFile: (groups: GenerationGroup[]) => void): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = IMPORT_EXTENSIONS.join(",");
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    readCanvasFile(file)
      .then(({ groups, isLegacyOtto }) => {
        if (isLegacyOtto) {
          logger.info("Imported legacy .otto file");
        }
        onFile(groups);
      })
      .catch((err) => {
        alert(err instanceof Error ? err.message : "Failed to import file");
      });
  };
  input.click();
}
