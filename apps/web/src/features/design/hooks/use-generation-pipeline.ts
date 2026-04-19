"use client";

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
import { DEFAULT_FRAME_WIDTH as FRAME_WIDTH } from "@/features/design";
import type { DesignIteration, GenerationGroup, Point } from "@/shared/types";
import { useWorkflowStream } from "@/features/design/hooks/use-workflow-stream";

const H_GAP = 60;
const GROUP_GAP = 120;
const ROW_HEIGHT = 700;
const ITEM_WIDTH = 640;

const ERROR_HTML = (msg: string) =>
  `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ ${msg}</p></div>`;

interface CanvasLike {
  offset: { x: number; y: number };
  scale: number;
  zoomToFit: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
}

export const useGenerationPipeline = (canvas: CanvasLike) => {
  const [groups, setGroups] = useAtom(groupsAtom);
  const settings = useAtomValue(settingsAtom);
  const derived = useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model],
  );
  const canvasImages = useAtomValue(canvasImagesAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [pipelineStages, setPipelineStages] = useAtom(pipelineStagesAtom);
  const genStatus = useAtomValue(genStatusAtom);
  const abortRef = useRef<AbortController | null>(null);
  const { startStream } = useWorkflowStream();

  const getGridPositions = useCallback(
    (count: number): Point[] => {
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
    },
    [canvas.offset, canvas.scale, groups],
  );

  const handleGenerate = useCallback(
    async (prompt: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const promptBarImages = settings.selectedImages?.map((img) => img.src) || [];
      const canvasImgDataUrls = canvasImages.length > 0 ? canvasImages.map((img) => img.dataUrl) : [];
      const contextImages =
        promptBarImages.length > 0 || canvasImgDataUrls.length > 0
          ? [...canvasImgDataUrls, ...promptBarImages]
          : undefined;

      const iterationCount = settings.conceptCount || 4;
      const positions = getGridPositions(iterationCount);
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
    [canvasImages, getGridPositions, settings, derived, startStream],
  );

  const handleRemix = useCallback(
    async (sourceIteration: DesignIteration, remixPrompt: string) => {
      setIsGenerating(true);
      const positions = getGridPositions(1);
      const remixId = `remix-${Date.now()}`;
      const groupId = `group-${remixId}`;

      const placeholder: DesignIteration = {
        id: remixId,
        html: "",
        label: "Remixing...",
        position: positions[0],
        width: sourceIteration.width || FRAME_WIDTH,
        height: sourceIteration.height || 300,
        prompt: remixPrompt,
        comments: [],
        isLoading: true,
      };

      setGroups((prev) => [
        ...prev,
        { id: groupId, prompt: `Remix: ${remixPrompt}`, iterations: [placeholder], position: positions[0], createdAt: Date.now() },
      ]);
      setPipelineStages((prev) => ({ ...prev, [remixId]: { stage: "layout", progress: 0.2 } }));

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch("/api/pipeline/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: sourceIteration.prompt || "",
            style: "remix",
            model: derived.model,
            apiKey: derived.apiKey || undefined,
            providerType: derived.providerType || undefined,
            baseURL: derived.baseURL || undefined,
            systemPrompt: settings.systemPrompt || undefined,
            revision: remixPrompt,
            existingHtml: sourceIteration.html,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Layout request failed (${response.status})`);
        const result = (await response.json()) as { html?: string; label?: string; width?: number; height?: number };

        setPipelineStages((prev) => ({ ...prev, [remixId]: { stage: "done", progress: 1 } }));
        setGroups((prev) =>
          prev.map((g) =>
            g.id !== groupId
              ? g
              : {
                  ...g,
                  iterations: [{ ...placeholder, html: result.html || "<p>Remix failed</p>", label: result.label || "Remix", width: result.width || placeholder.width, height: result.height || placeholder.height, isLoading: false }],
                },
          ),
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setGroups((prev) =>
            prev.map((g) => (g.id !== groupId ? g : { ...g, iterations: g.iterations.filter((iter) => !iter.isLoading) })).filter((g) => g.iterations.length > 0),
          );
        } else {
          const msg = err instanceof Error ? err.message : "Remix failed";
          setPipelineStages((prev) => ({ ...prev, [remixId]: { stage: "error", progress: 0 } }));
          setGroups((prev) =>
            prev.map((g) => (g.id !== groupId ? g : { ...g, iterations: [{ ...placeholder, html: ERROR_HTML(msg), isLoading: false }] })),
          );
        }
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
      }
    },
    [getGridPositions, setGroups, setPipelineStages, setIsGenerating, derived, settings],
  );

  const handleRevision = useCallback(
    async (
      _iterId: string,
      prompt: string,
      _style: string,
      _index: number,
      _critique: string | undefined,
      signal: AbortSignal,
      revisionOpts?: { revision: string; existingHtml: string },
    ): Promise<{ html: string; label: string; width?: number; height?: number; critique?: string; comment?: string }> => {
      if (!revisionOpts) throw new Error("Revision requires revisionOpts");

      const response = await fetch("/api/pipeline/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: "revision",
          model: derived.model,
          apiKey: derived.apiKey || undefined,
          providerType: derived.providerType || undefined,
          baseURL: derived.baseURL || undefined,
          systemPrompt: settings.systemPrompt || undefined,
          revision: revisionOpts.revision,
          existingHtml: revisionOpts.existingHtml,
        }),
        signal,
      });

      if (!response.ok) throw new Error(`Layout request failed (${response.status})`);
      const result = (await response.json()) as { html?: string; label?: string; width?: number; height?: number; comment?: string };

      return { html: result.html || "", label: result.label || "Revised", width: result.width, height: result.height, comment: result.comment };
    },
    [derived, settings],
  );

  return { handleGenerate, handleRemix, handleRevision, isGenerating, genStatus, pipelineStages, abortRef };
};
