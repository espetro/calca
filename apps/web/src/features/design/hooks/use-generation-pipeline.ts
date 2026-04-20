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
import type { DesignIteration, Point } from "@/shared/types";
import { useWorkflowStream } from "@/features/design/hooks/use-workflow-stream";
import { getApiUrl } from "@/lib/api-config";

const H_GAP = 60;
const GROUP_GAP = 120;
const ROW_HEIGHT = 700;
const ITEM_WIDTH = 640;

interface CanvasLike {
  offset: { x: number; y: number };
  scale: number;
  zoomToFit: (bounds: { minX: number; minY: number; maxX: number; maxY: number }) => void;
}

export const useGenerationPipeline = (canvas: CanvasLike) => {
  const [groups] = useAtom(groupsAtom);
  const settings = useAtomValue(settingsAtom);
  const derived = useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model],
  );
  const canvasImages = useAtomValue(canvasImagesAtom);
  const [isGenerating] = useAtom(isGeneratingAtom);
  const [pipelineStages] = useAtom(pipelineStagesAtom);
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
      const positions = getGridPositions(1);
      const groupId = `group-remix-${Date.now()}`;

      const promptBarImages = settings.selectedImages?.map((img) => img.src) || [];
      const canvasImgDataUrls = canvasImages.length > 0 ? canvasImages.map((img) => img.dataUrl) : [];
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
    [canvasImages, getGridPositions, settings, derived, startStream],
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

      const response = await fetch(getApiUrl("/api/workflow"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode: "quick",
          conceptCount: 1,
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

      if (!response.ok) throw new Error(`Workflow request failed (${response.status})`);

      const body = response.body;
      if (!body) throw new Error("No response body");

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let frameResult: { html: string; label: string; width?: number; height?: number; comment?: string; critique?: string } | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (signal.aborted) break;
          if (!line || line.startsWith(":")) continue;

          const colonIdx = line.indexOf(":");
          if (colonIdx === -1) continue;

          try {
            const part = JSON.parse(line.slice(colonIdx + 1)) as { type: string; data?: Record<string, unknown> };
            if (part.type === "data-workflow" && part.data) {
              const steps = part.data.steps as Record<string, { name: string; status: string; output: unknown }> | undefined;
              const collectStep = steps?.["collectResults"];
              if (collectStep?.output && typeof collectStep.output === "object") {
                const output = collectStep.output as { frames?: Array<{ html?: string; label?: string; width?: number; height?: number; comment?: string; critique?: string }> };
                if (output.frames && output.frames.length > 0 && output.frames[0]) {
                  const f = output.frames[0];
                  frameResult = {
                    html: f.html ?? "",
                    label: f.label ?? "Revised",
                    width: f.width,
                    height: f.height,
                    comment: f.comment,
                    critique: f.critique,
                  };
                }
              }
            }
          } catch {
            // skip unparseable lines
          }
        }
      }

      if (!frameResult) {
        throw new Error("No frame result received from workflow");
      }

      return {
        html: frameResult.html || "",
        label: frameResult.label || "Revised",
        width: frameResult.width,
        height: frameResult.height,
        comment: frameResult.comment,
        critique: frameResult.critique,
      };
    },
    [derived, settings],
  );

  return { handleGenerate, handleRemix, handleRevision, isGenerating, genStatus, pipelineStages, abortRef };
};
