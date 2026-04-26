import { useCallback, useMemo, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import { canvasImagesAtom } from "@/features/design/state/images-atoms";
import {
  isGeneratingAtom,
  pipelineStagesAtom,
  genStatusAtom,
} from "@/features/design/state/generation-atoms";
import { settingsAtom } from "@/features/settings/state/settings-atoms";
import { deriveProviderFields } from "@/features/settings/lib/derive-provider-fields";
import type { DesignIteration, GenerationGroup, Point } from "@/shared/types";
import { useWorkflowStream } from "@/features/design/hooks/use-workflow-stream";
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
  const abortRef = useRef<AbortController | null>(null);

  const [groups] = useAtom(groupsAtom);
  const settings = useAtomValue(settingsAtom);
  const canvasImages = useAtomValue(canvasImagesAtom);
  const [isGenerating] = useAtom(isGeneratingAtom);
  const [pipelineStages] = useAtom(pipelineStagesAtom);
  const genStatus = useAtomValue(genStatusAtom);

  const derived = useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model],
  );

  const { startStream } = useWorkflowStream();

  const { mutate: handleRevision } = usePostRevision();

  const handleGenerate = useCallback(
    async (prompt: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const promptBarImages = settings.selectedImages?.map((img) => img.src) || [];
      const canvasImgDataUrls =
        canvasImages.length > 0 ? canvasImages.map((img) => img.dataUrl) : [];
      const contextImages =
        promptBarImages.length > 0 || canvasImgDataUrls.length > 0
          ? [...canvasImgDataUrls, ...promptBarImages]
          : undefined;

      const iterationCount = settings.conceptCount || 4;
      const positions = getGridPositions(canvas, groups, iterationCount);
      const groupId = `group-${Date.now()}`;

      await startStream({
        prompt,
        groupId,
        positions,
        conceptCount: iterationCount,
        mode: settings.quickMode ? "quick" : "sequential",
        model: derived.model,
        apiKey: derived.apiKey || undefined,
        baseURL: derived.baseURL || undefined,
        providerType: derived.providerType || undefined,
        geminiKey: settings.geminiKey || undefined,
        unsplashKey: settings.unsplashKey || undefined,
        openaiKey: settings.openaiKey || undefined,
        systemPrompt: settings.systemPrompt || undefined,
        contextImages,
      });

      abortRef.current = null;
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
        prompt: sourceIteration.prompt || remixPrompt,
        groupId,
        positions,
        conceptCount: 1,
        mode: "quick",
        model: derived.model,
        apiKey: derived.apiKey || undefined,
        baseURL: derived.baseURL || undefined,
        providerType: derived.providerType || undefined,
        geminiKey: settings.geminiKey || undefined,
        unsplashKey: settings.unsplashKey || undefined,
        openaiKey: settings.openaiKey || undefined,
        systemPrompt: settings.systemPrompt || undefined,
        contextImages,
        revision: remixPrompt,
        existingHtml: sourceIteration.html,
      });

      abortRef.current = null;
    },
    [canvasImages, canvas, groups, settings, derived, startStream],
  );

  return {
    handleGenerate,
    handleRemix,
    handleRevision,
    isGenerating,
    genStatus,
    pipelineStages,
    abortRef,
  };
};
