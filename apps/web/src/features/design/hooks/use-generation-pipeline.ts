"use client";

import { useCallback, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { usePipelinePost } from "@/features/design/hooks/use-pipeline-post";
import { usePlanConcepts } from "@/features/design/hooks/use-plan-concepts";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import { canvasImagesAtom } from "@/features/design/state/images-atoms";
import {
  isGeneratingAtom,
  pipelineStagesAtom,
  genStatusAtom,
} from "@/features/design/state/generation-atoms";
import { settingsAtom } from "@/features/settings/state/settings-atoms";
import { DEFAULT_FRAME_WIDTH as FRAME_WIDTH } from "@/features/design";
import type {
  DesignIteration,
  GenerationGroup,
  Point,
} from "@/shared/types";

const H_GAP = 60;
const GROUP_GAP = 120;
const ROW_HEIGHT = 700;
const ITEM_WIDTH = 640;

const VARIATION_STYLES = [
  "Refined and premium — think Stripe or Linear. Subtle gradients, generous whitespace, sophisticated color palette",
  "Bold and expressive — vibrant colors, large confident typography, strong visual hierarchy, creative shapes",
  "Warm and approachable — friendly rounded shapes, warm color palette, inviting feel, human-centered",
  "Dark and dramatic — dark backgrounds, glowing accents, cinematic feel, high contrast, moody atmosphere",
];

const capOversizedSections = (html: string): string => {
  let result = html;
  result = result.replace(
    /(<(?:section|div)\s[^>]*style="[^"]*?)height\s*:\s*(\d+)px/gi,
    (_match: string, prefix: string, heightStr: string) => {
      const h = parseInt(heightStr, 10);
      return h > 800
        ? `${prefix}height:${h}px;max-height:800px;overflow:hidden`
        : _match;
    }
  );
  result = result.replace(
    /(<(?:section|div)\s[^>]*style="[^"]*?)min-height\s*:\s*(\d+)px/gi,
    (_match: string, prefix: string, heightStr: string) => {
      const h = parseInt(heightStr, 10);
      return h > 800
        ? `${prefix}min-height:${h}px;max-height:800px;overflow:hidden`
        : _match;
    }
  );
  result = result.replace(
    /(<(?:section|div)\s[^>]*style="[^"]*?)(?:min-)?height\s*:\s*100vh/gi,
    (_match: string, prefix: string) =>
      `${prefix}height:auto;max-height:800px;overflow:hidden`
  );
  return result;
};

interface CanvasLike {
  offset: { x: number; y: number };
  scale: number;
  zoomToFit: (bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }) => void;
}

export const useGenerationPipeline = (canvas: CanvasLike) => {
  const [groups, setGroups] = useAtom(groupsAtom);
  const settings = useAtomValue(settingsAtom);
  const canvasImages = useAtomValue(canvasImagesAtom);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [pipelineStages, setPipelineStages] = useAtom(pipelineStagesAtom);
  const [genStatus, setGenStatus] = useAtom(genStatusAtom);
  const quickMode = settings.quickMode;

  const abortRef = useRef<AbortController | null>(null);
  const pipelineMutation = usePipelinePost();
  const planConceptsMutation = usePlanConcepts();

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
            maxBottom = Math.max(
              maxBottom,
              iter.position.y + (iter.height || ROW_HEIGHT)
            );
          }
        }
        startX = groups[0].iterations[0]?.position.x ?? 0;
        startY = maxBottom + GROUP_GAP;
      }

      return Array.from({ length: count }, (_, i) => ({
        x: startX + i * (ITEM_WIDTH + H_GAP),
        y: startY,
      }));
    },
    [canvas.offset, canvas.scale, groups]
  );

  const runPipelineForFrame = useCallback(
    async (
      iterId: string,
      prompt: string,
      style: string,
      index: number,
      critique: string | undefined,
      signal: AbortSignal,
      revisionOpts?: { revision: string; existingHtml: string },
      contextImages?: string[]
    ): Promise<{
      html: string;
      label: string;
      width?: number;
      height?: number;
      critique?: string;
      comment?: string;
    }> => {
      const isRevision = !!revisionOpts;
      const enableImages = !!(
        settings.geminiKey ||
        settings.unsplashKey ||
        settings.openaiKey
      );
      const enableQA = !isRevision && !quickMode;
      const skipCritique = !isRevision && quickMode;

      const availableSources: string[] = [];
      if (settings.unsplashKey) availableSources.push("unsplash");
      if (settings.openaiKey) availableSources.push("dalle");
      if (settings.geminiKey) availableSources.push("gemini");

      setPipelineStages((prev) => ({
        ...prev,
        [iterId]: { stage: "layout", progress: 0.2 },
      }));

      const layoutResult = (await pipelineMutation.mutateAsync({
        url: "/api/pipeline/layout",
        body: {
          prompt,
          style,
          model: settings.model,
          apiKey: settings.apiKey || undefined,
          providerType: settings.providerType || undefined,
          baseURL: settings.baseURL || undefined,
          systemPrompt: settings.systemPrompt || undefined,
          critique,
          availableSources,
          ...(revisionOpts || {}),
          ...(contextImages && contextImages.length > 0
            ? { contextImages }
            : {}),
        },
        signal,
      })) as {
        html: string;
        width?: number;
        height?: number;
        comment?: string;
      };

      let html: string = layoutResult.html;
      const width: number | undefined = layoutResult.width;
      const height: number | undefined = layoutResult.height;
      const aiComment: string | undefined = layoutResult.comment;

      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          iterations: g.iterations.map((iter) =>
            iter.id !== iterId
              ? iter
              : {
                  ...iter,
                  html,
                  width: width || iter.width,
                  height: height || iter.height,
                  isLoading: false,
                }
          ),
        }))
      );

      if (enableImages) {
        setPipelineStages((prev) => ({
          ...prev,
          [iterId]: { stage: "images", progress: 0.45 },
        }));
        try {
          const imgResult = (await pipelineMutation.mutateAsync({
            url: "/api/pipeline/images",
            body: {
              html,
              geminiKey: settings.geminiKey || undefined,
              unsplashKey: settings.unsplashKey || undefined,
              openaiKey: settings.openaiKey || undefined,
              viewport:
                width && height ? { width, height } : undefined,
            },
            signal,
          })) as { html?: string; imageCount?: number };

          if (
            imgResult.html &&
            imgResult.imageCount &&
            imgResult.imageCount > 0
          ) {
            html = imgResult.html;
            setPipelineStages((prev) => ({
              ...prev,
              [iterId]: { stage: "compositing", progress: 0.65 },
            }));
            setGroups((prev) =>
              prev.map((g) => ({
                ...g,
                iterations: g.iterations.map((iter) =>
                  iter.id !== iterId ? iter : { ...iter, html }
                ),
              }))
            );
          }
        } catch (imgErr) {
          console.warn(
            "Image step failed, continuing with placeholders:",
            imgErr
          );
        }
      } else {
        setPipelineStages((prev) => ({
          ...prev,
          [iterId]: {
            stage: "images",
            progress: 0.45,
            skipped: true,
            reason:
              "No image API keys — add Unsplash, DALL·E, or Gemini key in Settings",
          },
        }));
      }

      if (enableQA) {
        setPipelineStages((prev) => ({
          ...prev,
          [iterId]: { stage: "review", progress: 0.8 },
        }));
        try {
          const reviewImages: string[] = [];
          const htmlForReview = html.replace(
            /src="(data:image\/[^"]+)"/g,
            (_m: string, uri: string) => {
              const idx = reviewImages.length;
              reviewImages.push(uri);
              return `src="[IMG_STRIPPED_${idx}]"`;
            }
          );
          const qaResult = (await pipelineMutation.mutateAsync({
            url: "/api/pipeline/review",
            body: {
              html: htmlForReview,
              prompt,
              width,
              height,
              model: settings.model,
              apiKey: settings.apiKey || undefined,
              providerType: settings.providerType || undefined,
              baseURL: settings.baseURL || undefined,
            },
            signal,
          })) as { html?: string };
          if (qaResult.html) {
            let reviewed = qaResult.html;
            for (let i = 0; i < reviewImages.length; i++) {
              reviewed = reviewed.replace(
                `[IMG_STRIPPED_${i}]`,
                reviewImages[i]
              );
            }
            html = reviewed;
            setGroups((prev) =>
              prev.map((g) => ({
                ...g,
                iterations: g.iterations.map((iter) =>
                  iter.id !== iterId ? iter : { ...iter, html }
                ),
              }))
            );
          }
        } catch (qaErr) {
          console.warn("Visual QA failed, using unreviewed version:", qaErr);
        }
      }

      html = capOversizedSections(html);

      const label = isRevision ? "Revised" : `Variation ${index + 1}`;
      let critiqueText: string | undefined;
      setPipelineStages((prev) => ({
        ...prev,
        [iterId]: { stage: "done", progress: 1.0 },
      }));

      if (!skipCritique) {
        try {
          const htmlForCritique = html.replace(
            /src="(data:image\/[^"]+)"/g,
            () => 'src="[IMG_STRIPPED]"'
          );
          const critiqueResult = (await pipelineMutation.mutateAsync({
            url: "/api/pipeline/critique",
            body: {
              html: htmlForCritique,
              prompt,
              model: settings.model,
              apiKey: settings.apiKey || undefined,
              providerType: settings.providerType || undefined,
              baseURL: settings.baseURL || undefined,
            },
            signal,
          })) as { critique?: string };
          critiqueText = critiqueResult.critique || undefined;
        } catch {
          // critique is optional
        }
      }

      return {
        html,
        label,
        width,
        height,
        critique: critiqueText,
        comment: aiComment,
      };
    },
    [
      settings.apiKey,
      settings.model,
      settings.systemPrompt,
      settings.geminiKey,
      settings.unsplashKey,
      settings.openaiKey,
      settings.providerType,
      settings.baseURL,
      quickMode,
      setPipelineStages,
      setGroups,
      pipelineMutation,
    ]
  );

  const handleGenerate = useCallback(
    async (prompt: string) => {
      const contextImages =
        canvasImages.length > 0
          ? canvasImages.map((img) => img.dataUrl)
          : undefined;
      setIsGenerating(true);
      setGenStatus("Planning concepts…");
      const groupId = `group-${Date.now()}`;

      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        let iterationCount = settings.conceptCount || 4;
        let concepts: string[] = [];

        try {
          const plan = await planConceptsMutation.mutateAsync({
            prompt,
            count: iterationCount,
            apiKey: settings.apiKey || undefined,
            model: settings.model,
            providerType: settings.providerType || undefined,
            baseURL: settings.baseURL || undefined,
            signal: controller.signal,
          });
          concepts = plan.concepts;
        } catch {
          // planning failed — continue with defaults
        }

        const positions = getGridPositions(iterationCount);

        const newGroup: GenerationGroup = {
          id: groupId,
          prompt,
          iterations: [],
          position: positions[0],
          createdAt: Date.now(),
        };

        setGroups((prev) => [...prev, newGroup]);

        const completedFrames: {
          x: number;
          y: number;
          w: number;
          h: number;
        }[] = [];

        const getNextPosition = (index: number): Point => {
          if (index === 0 || completedFrames.length === 0) return positions[0];
          const prev = completedFrames[completedFrames.length - 1];
          return { x: prev.x + prev.w + H_GAP, y: prev.y };
        };

        const addPlaceholder = (
          iterId: string,
          index: number,
          pos: Point
        ) => {
          setPipelineStages((prev) => ({
            ...prev,
            [iterId]: { stage: "layout", progress: 0.2 },
          }));
          setGroups((prev) =>
            prev.map((g) => {
              if (g.id !== groupId) return g;
              return {
                ...g,
                iterations: [
                  ...g.iterations,
                  {
                    id: iterId,
                    html: "",
                    label: `Variation ${index + 1}`,
                    position: pos,
                    width: 400,
                    height: 300,
                    prompt,
                    comments: [],
                    isLoading: true,
                  },
                ],
              };
            })
          );
        };

        const completeFrame = (
          iterId: string,
          result: {
            html: string;
            label: string;
            width?: number;
            height?: number;
          },
          pos: Point
        ) => {
          const w = result.width || FRAME_WIDTH;
          const h = result.height || 400;
          completedFrames.push({ x: pos.x, y: pos.y, w, h });

          setPipelineStages((prev) => ({
            ...prev,
            [iterId]: { stage: "done", progress: 1 },
          }));
          setGroups((prev) =>
            prev.map((g) => {
              if (g.id !== groupId) return g;
              return {
                ...g,
                iterations: g.iterations.map((existing) => {
                  if (existing.id !== iterId) return existing;
                  return {
                    ...existing,
                    html: result.html || "<p>Failed to generate</p>",
                    label: result.label || existing.label,
                    width: result.width || existing.width,
                    height: result.height || existing.height,
                    isLoading: false,
                  };
                }),
              };
            })
          );

          setTimeout(() => {
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity;
            for (const f of completedFrames) {
              minX = Math.min(minX, f.x);
              minY = Math.min(minY, f.y);
              maxX = Math.max(maxX, f.x + f.w);
              maxY = Math.max(maxY, f.y + f.h);
            }
            canvas.zoomToFit({ minX, minY, maxX, maxY });
          }, 150);
        };

        if (quickMode) {
          const iterIds: string[] = [];
          for (let i = 0; i < iterationCount; i++) {
            const iterId = `${groupId}-iter-${i}`;
            iterIds.push(iterId);
            addPlaceholder(iterId, i, positions[i]);
          }

          setGenStatus(`Running ${iterationCount} frames in parallel…`);
          const results = await Promise.allSettled(
            iterIds.map((iterId, i) =>
              runPipelineForFrame(
                iterId,
                prompt,
                concepts[i] || VARIATION_STYLES[i % VARIATION_STYLES.length],
                i,
                undefined,
                controller.signal,
                undefined,
                contextImages
              ).then((result) => {
                completeFrame(iterId, result, positions[i]);
                return result;
              })
            )
          );

          results.forEach((r, i) => {
            if (r.status === "rejected") {
              const msg =
                r.reason instanceof Error ? r.reason.message : "Failed";
              setPipelineStages((prev) => ({
                ...prev,
                [iterIds[i]]: { stage: "error", progress: 0 },
              }));
              completeFrame(
                iterIds[i],
                {
                  html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ ${msg}</p></div>`,
                  label: `Variation ${i + 1}`,
                },
                positions[i]
              );
            }
          });
        } else {
          let critique: string | undefined;

          for (let i = 0; i < iterationCount; i++) {
            if (controller.signal.aborted) break;
            const iterId = `${groupId}-iter-${i}`;
            const pos = getNextPosition(i);

            setGenStatus(`Designing ${i + 1} of ${iterationCount}…`);
            addPlaceholder(iterId, i, pos);

            try {
              const result = await runPipelineForFrame(
                iterId,
                prompt,
                concepts[i] || VARIATION_STYLES[i % VARIATION_STYLES.length],
                i,
                critique,
                controller.signal,
                undefined,
                contextImages
              );

              setGroups((prev) =>
                prev.map((g) => {
                  if (g.id !== groupId) return g;
                  return {
                    ...g,
                    iterations: g.iterations.map((iter) => {
                      if (iter.id !== iterId) return iter;
                      return { ...iter, position: pos };
                    }),
                  };
                })
              );

              completeFrame(iterId, result, pos);
              critique = result.critique;
            } catch (err) {
              if (err instanceof Error && err.name === "AbortError") throw err;
              const msg = err instanceof Error ? err.message : "Failed";
              setPipelineStages((prev) => ({
                ...prev,
                [iterId]: { stage: "error", progress: 0 },
              }));
              completeFrame(
                iterId,
                {
                  html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ ${msg}</p></div>`,
                  label: `Variation ${i + 1}`,
                },
                pos
              );
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setGroups((prev) =>
            prev
              .map((g) => {
                if (g.id !== groupId) return g;
                const kept = g.iterations.filter((iter) => !iter.isLoading);
                const removedIds = g.iterations
                  .filter((iter) => iter.isLoading)
                  .map((iter) => iter.id);
                if (removedIds.length) {
                  setPipelineStages((prev) => {
                    const next = { ...prev };
                    removedIds.forEach((id) => delete next[id]);
                    return next;
                  });
                }
                return { ...g, iterations: kept };
              })
              .filter((g) => g.iterations.length > 0)
          );
        } else {
          const msg =
            err instanceof Error ? err.message : "Generation failed";
          console.error("Generation failed:", msg);
          setGroups((prev) =>
            prev.map((g) => {
              if (g.id !== groupId) return g;
              return {
                ...g,
                iterations: g.iterations.map((iter) => {
                  if (!iter.isLoading) return iter;
                  return {
                    ...iter,
                    html: `<div style="padding:32px;color:#666;font-family:system-ui">
                      <p style="font-size:14px">⚠ ${msg}</p>
                      <p style="font-size:12px;margin-top:8px;color:#999">Check Settings or try again</p>
                    </div>`,
                    isLoading: false,
                  };
                }),
              };
            })
          );
        }
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
        setGenStatus("");
      }
    },
    [
      canvasImages,
      getGridPositions,
      settings,
      canvas,
      quickMode,
      runPipelineForFrame,
      setGroups,
      setIsGenerating,
      setGenStatus,
      setPipelineStages,
      planConceptsMutation,
    ]
  );

  const handleRemix = useCallback(
    async (sourceIteration: DesignIteration, remixPrompt: string) => {
      setIsGenerating(true);
      const positions = getGridPositions(1);
      const remixId = `remix-${Date.now()}`;

      const placeholder: DesignIteration = {
        id: remixId,
        html: "",
        label: "Remixing...",
        position: positions[0],
        width: sourceIteration.width || 400,
        height: sourceIteration.height || 300,
        prompt: remixPrompt,
        comments: [],
        isLoading: true,
      };

      const sourceGroup = groups.find((g) =>
        g.iterations.some((it) => it.id === sourceIteration.id)
      );
      const newGroup: GenerationGroup = {
        id: `group-${remixId}`,
        prompt: `Remix: ${remixPrompt}`,
        iterations: [placeholder],
        position: positions[0],
        createdAt: Date.now(),
      };

      setGroups((prev) => [...prev, newGroup]);
      setPipelineStages((prev) => ({
        ...prev,
        [remixId]: { stage: "layout", progress: 0.2 },
      }));

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        const result = await runPipelineForFrame(
          remixId,
          sourceIteration.prompt || "",
          "remix",
          0,
          undefined,
          controller.signal,
          { revision: remixPrompt, existingHtml: sourceIteration.html }
        );

        setPipelineStages((prev) => ({
          ...prev,
          [remixId]: { stage: "done", progress: 1 },
        }));
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== newGroup.id) return g;
            return {
              ...g,
              iterations: [
                {
                  ...placeholder,
                  html: result.html || "<p>Remix failed</p>",
                  label: result.label || "Remix",
                  width: result.width || placeholder.width,
                  height: result.height || placeholder.height,
                  isLoading: false,
                },
              ],
            };
          })
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setGroups((prev) =>
            prev
              .map((g) => {
                if (g.id !== newGroup.id) return g;
                return {
                  ...g,
                  iterations: g.iterations.filter((iter) => !iter.isLoading),
                };
              })
              .filter((g) => g.iterations.length > 0)
          );
        } else {
          const msg = err instanceof Error ? err.message : "Remix failed";
          setGroups((prev) =>
            prev.map((g) => {
              if (g.id !== newGroup.id) return g;
              return {
                ...g,
                iterations: [
                  {
                    ...placeholder,
                    html: `<div style="padding:32px;color:#666;font-family:system-ui"><p style="font-size:14px">⚠ ${msg}</p></div>`,
                    isLoading: false,
                  },
                ],
              };
            })
          );
        }
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
      }
    },
    [getGridPositions, groups, setGroups, setPipelineStages, setIsGenerating, runPipelineForFrame]
  );

  return {
    handleGenerate,
    handleRemix,
    isGenerating,
    genStatus,
    pipelineStages,
    abortRef,
    runPipelineForFrame,
  };
};
