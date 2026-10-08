import { groupsAtom } from "@calca/canvas-flow";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";

import { useWorkflowStream } from "#/features/design/hooks/use-workflow-stream";
import {
  genStartedAtAtom,
  genStatusAtom,
  isGeneratingAtom,
  pipelineStagesAtom,
} from "#/features/design/state/generation-atoms";
import { canvasImagesAtom } from "#/features/design/state/images-atoms";
import { deriveProviderFields } from "#/features/settings/lib/derive-provider-fields";
import { settingsAtom } from "#/features/settings/state/settings-atoms";
import { m } from "#/lib/i18n";
import type { DesignIteration, GenerationGroup, Point } from "#/shared/types";

import usePostRevision from "./api/use-post-revision";

const H_GAP = 60;
const GROUP_GAP = 120;
const ROW_HEIGHT = 700;
const ITEM_WIDTH = 640;

const getGridPositions = (
  canvas: CanvasLike,
  groups: GenerationGroup[],
  count: number,
): Point[] => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gridW = count * ITEM_WIDTH + (count - 1) * H_GAP;
  let startX: number;
  let startY: number;

  if (groups.length === 0) {
    startX = (vw / 2 - canvas.offset.x) / canvas.scale - gridW / 2;
    startY = (vh / 3 - canvas.offset.y) / canvas.scale;
  } else {
    let maxBottom = 0;
    for (const g of groups) {
      for (const iter of g.iterations) {
        maxBottom = Math.max(maxBottom, iter.position.y + (iter.height || ROW_HEIGHT));
      }
    }
    startX = groups[0]?.iterations[0]?.position.x ?? 0;
    startY = maxBottom + GROUP_GAP;
  }

  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * (ITEM_WIDTH + H_GAP),
    y: startY,
  }));
};

interface CanvasLike {
  offset: { x: number; y: number };
  scale: number;
  zoomToFit: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
}

export const useGenerationPipeline = (canvas: CanvasLike) => {
  const [groups] = useAtom(groupsAtom);
  const settings = useAtomValue(settingsAtom);
  const canvasImages = useAtomValue(canvasImagesAtom);
  const [isGenerating] = useAtom(isGeneratingAtom);
  const [pipelineStages] = useAtom(pipelineStagesAtom);
  const genStatus = useAtomValue(genStatusAtom);
  const genStartedAt = useAtomValue(genStartedAtAtom);

  const derived = useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model],
  );

  const { abort, startStream } = useWorkflowStream();

  const { mutateAsync: handleRevisionRaw } = usePostRevision();

  const handleRevision = useCallback(
    async (
      _iterId: string,
      prompt: string,
      _style: string,
      _index: number,
      _critique: string | undefined,
      signal: AbortSignal,
      revisionOpts?: { revision: string; existingHtml: string },
    ): Promise<{
      html: string;
      label: string;
      width?: number;
      height?: number;
      critique?: string;
      comment?: string;
    }> => {
      return handleRevisionRaw({
        prompt,
        signal,
        options: revisionOpts
          ? { revision: revisionOpts.revision, existingHtml: revisionOpts.existingHtml }
          : undefined,
        systemPrompt: settings.systemPrompt,
        derived,
      });
    },
    [handleRevisionRaw, settings.systemPrompt, derived],
  );

  const handleGenerate = useCallback(
    async (prompt: string) => {
      const promptBarImages = settings.selectedImages?.map((img) => img.src) || [];
      const canvasImgDataUrls =
        canvasImages.length > 0 ? canvasImages.map((img) => img.dataUrl) : [];
      const contextImages =
        promptBarImages.length > 0 || canvasImgDataUrls.length > 0
          ? [...canvasImgDataUrls, ...promptBarImages]
          : undefined;

      const generationMode = settings.generationMode ?? "detailed";
      // "fast" mode targets weak/free models — clamp variations so a run
      // stays well inside tight rate limits.
      const iterationCount = Math.min(
        settings.conceptCount || 4,
        generationMode === "fast" ? 2 : 10,
      );
      const positions = getGridPositions(canvas, groups, iterationCount);
      const groupId = `group-${Date.now()}`;

      await startStream({
        apiKey: derived.apiKey || undefined,
        baseURL: derived.baseURL || undefined,
        conceptCount: iterationCount,
        contextImages,
        critique: settings.critiqueMode,
        geminiKey: settings.geminiKey || undefined,
        groupId,
        mode: generationMode,
        model: derived.model,
        openaiKey: settings.openaiKey || undefined,
        positions,
        prompt,
        providerType: derived.providerType || undefined,
        systemPrompt: settings.systemPrompt || undefined,
        unsplashKey: settings.unsplashKey || undefined,
      });
    },
    [canvasImages, canvas, groups, settings, derived, startStream],
  );

  const handleRemix = useCallback(
    async (sourceIteration: DesignIteration, remixPrompt: string) => {
      const positions = getGridPositions(canvas, groups, 1);
      const groupId = `group-remix-${Date.now()}`;

      const promptBarImages = settings.selectedImages?.map((img) => img.src) || [];
      const canvasImgDataUrls =
        canvasImages.length > 0 ? canvasImages.map((img) => img.dataUrl) : [];
      const contextImages =
        promptBarImages.length > 0 || canvasImgDataUrls.length > 0
          ? [...canvasImgDataUrls, ...promptBarImages]
          : undefined;

      await startStream({
        apiKey: derived.apiKey || undefined,
        baseURL: derived.baseURL || undefined,
        conceptCount: 1,
        contextImages,
        existingHtml: sourceIteration.html,
        geminiKey: settings.geminiKey || undefined,
        groupId,
        mode: settings.generationMode ?? "detailed",
        model: derived.model,
        openaiKey: settings.openaiKey || undefined,
        positions,
        prompt: sourceIteration.prompt || remixPrompt,
        providerType: derived.providerType || undefined,
        remixOf: sourceIteration.label || m.design_defaultDesignLabel(),
        revision: remixPrompt,
        systemPrompt: settings.systemPrompt || undefined,
        unsplashKey: settings.unsplashKey || undefined,
      });
    },
    [canvasImages, canvas, groups, settings, derived, startStream],
  );

  return {
    cancel: abort,
    genStartedAt,
    genStatus,
    handleGenerate,
    handleRemix,
    handleRevision,
    isGenerating,
    pipelineStages,
  };
};
