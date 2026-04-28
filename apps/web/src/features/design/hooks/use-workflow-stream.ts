import { getLogger } from "@app/logger";
import { useSetAtom } from "jotai";
import { useCallback, useRef } from "react";

const logger = getLogger(["calca", "web", "design", "stream"]);

import {
  trackGenerationStart,
  trackGenerationComplete,
  trackGenerationFailed,
  trackPipelineStageStart,
  trackPipelineStageComplete,
} from "@app/analytics";

import {
  isGeneratingAtom,
  pipelineStagesAtom,
  genStatusAtom,
} from "@/features/design/state/generation-atoms";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import { apiClient } from "@/lib/api-client";
import type { GenerationGroup, PipelineStage, Point } from "@/shared/types";

// ── Wire types ───────────────────────────────────────────────────────────────
// Mastra handleWorkflowStream emits `data-workflow` SSE parts per
// AI SDK v6 UIMessageStream wire protocol: each line is `<index>:<json>\n`.

interface WorkflowStepResult {
  name: string;
  status: string;
  input: Record<string, unknown> | null;
  output: unknown;
  suspendPayload: Record<string, unknown> | null;
  resumePayload: Record<string, unknown> | null;
}

interface WorkflowData {
  name: string;
  status: "running" | "suspended" | "success" | "failed" | string;
  steps: Record<string, WorkflowStepResult>;
  output: {
    usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
  } | null;
}

interface DataWorkflowPart {
  type: "data-workflow";
  id: string;
  data: WorkflowData;
}

interface FrameResult {
  html: string;
  width?: number;
  height?: number;
  label: string;
  comment?: string;
  critique?: string;
}

interface WorkflowOutput {
  frames: FrameResult[];
  summary?: string;
}

const STEP_STAGE_MAP: Record<string, { stage: PipelineStage; progress: number }> = {
  collectResults: { stage: "refining", progress: 0.98 },
  frameOrchestrator: { stage: "layout", progress: 0.2 },
  plan: { stage: "layout", progress: 0.1 },
  summary: { stage: "refining", progress: 0.95 },
};

const parseSSELine = (line: string): { type: string; [key: string]: unknown } | null => {
  if (!line || line.startsWith(":")) {
    return null;
  }

  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) {
    return null;
  }

  try {
    return JSON.parse(line.slice(colonIdx + 1)) as { type: string; [key: string]: unknown };
  } catch {
    return null;
  }
};

interface WorkflowStreamParams {
  prompt: string;
  groupId: string;
  positions: Point[];
  conceptCount: number;
  mode: "quick" | "sequential";
  model?: string;
  apiKey?: string;
  baseURL?: string;
  providerType?: string;
  geminiKey?: string;
  unsplashKey?: string;
  openaiKey?: string;
  systemPrompt?: string;
  contextImages?: string[];
  revision?: string;
  existingHtml?: string;
}

export const useWorkflowStream = () => {
  const setGroups = useSetAtom(groupsAtom);
  const setIsGenerating = useSetAtom(isGeneratingAtom);
  const setPipelineStages = useSetAtom(pipelineStagesAtom);
  const setGenStatus = useSetAtom(genStatusAtom);

  const abortRef = useRef<AbortController | null>(null);
  const generationStartTimeRef = useRef<number>(0);
  const completedStepsRef = useRef<Set<string>>(new Set());

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const startStream = useCallback(
    async (params: WorkflowStreamParams) => {
      const {
        prompt,
        groupId,
        positions,
        conceptCount,
        mode,
        model,
        apiKey,
        baseURL,
        providerType,
        geminiKey,
        unsplashKey,
        openaiKey,
        systemPrompt,
        contextImages,
        revision,
        existingHtml,
      } = params;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setGenStatus("Starting workflow…");

      generationStartTimeRef.current = Date.now();
      completedStepsRef.current = new Set();

      const wordCount = prompt.split(/\s+/).filter(Boolean).length;
      trackGenerationStart(model || "unknown", wordCount, conceptCount);

      const newGroup: GenerationGroup = {
        createdAt: Date.now(),
        id: groupId,
        iterations: [],
        position: positions[0],
        prompt,
      };
      setGroups((prev) => [...prev, newGroup]);

      const iterIds: string[] = [];
      for (let i = 0; i < conceptCount; i++) {
        const iterId = `${groupId}-iter-${i}`;
        iterIds.push(iterId);

        setPipelineStages((prev) => ({
          ...prev,
          [iterId]: { progress: 0, stage: "queued" },
        }));
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) {
            return g;
          }
          return {
            ...g,
            iterations: iterIds.map((iterId, i) => ({
              comments: [],
              height: 300,
              html: "",
              id: iterId,
              isLoading: true,
              label: `Variation ${i + 1}`,
              position: positions[i],
              prompt,
              width: 400,
            })),
          };
        }),
      );

      try {
        const response = await apiClient.api.workflow.$post({
          json: {
            apiKey,
            baseURL,
            conceptCount,
            contextImages,
            existingHtml,
            geminiKey,
            mode,
            model,
            openaiKey,
            prompt,
            providerType,
            revision,
            systemPrompt,
            unsplashKey,
          },
          signal: controller.signal,
        });
        const { body } = response;

        if (!body) {
          throw new Error("No response body");
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let workflowOutput: WorkflowOutput | null = null;
        const completedFrameIndices = new Set<number>();

        const mapStepToStages = (steps: Record<string, WorkflowStepResult>) => {
          for (const [, stepResult] of Object.entries(steps)) {
            const stepName = stepResult.name;
            const mapping = STEP_STAGE_MAP[stepName];

            if (!mapping) {
              continue;
            }

            if (
              stepResult.status === "running" &&
              !completedStepsRef.current.has(stepName + "_running")
            ) {
              completedStepsRef.current.add(stepName + "_running");
              for (let i = 0; i < conceptCount; i++) {
                const iterId = iterIds[i];
                if (!iterId) {
                  continue;
                }

                setPipelineStages((prev) => {
                  const existing = prev[iterId];
                  if (existing && (existing.stage === "done" || existing.stage === "error")) {
                    return prev;
                  }
                  return {
                    ...prev,
                    [iterId]: {
                      progress: mapping.progress + (i / conceptCount) * 0.15,
                      stage: mapping.stage,
                    },
                  };
                });
              }
              trackPipelineStageStart(mapping.stage, iterIds[0] || groupId);

              const statusLabel =
                stepName === "frameOrchestrator"
                  ? `Processing frames…`
                  : `${stepName} step running…`;
              setGenStatus(statusLabel);
            }

            if (
              stepName === "frameOrchestrator" &&
              (stepResult.status === "success" || stepResult.status === "finished") &&
              stepResult.output
            ) {
              const output = stepResult.output as {
                frames?: FrameResult[];
              };
              if (output.frames && Array.isArray(output.frames)) {
                const stageDuration = Date.now() - generationStartTimeRef.current;
                for (let i = 0; i < output.frames.length; i++) {
                  if (completedFrameIndices.has(i)) {
                    continue;
                  }

                  const frame = output.frames[i];
                  if (!frame) {
                    continue;
                  }

                  const iterId = iterIds[i];
                  if (!iterId) {
                    continue;
                  }

                  completedFrameIndices.add(i);

                  setPipelineStages((prev) => ({
                    ...prev,
                    [iterId]: { progress: 1, stage: "done" },
                  }));

                  trackPipelineStageComplete("layout", iterId, stageDuration);

                  setGroups((prev) =>
                    prev.map((g) => {
                      if (g.id !== groupId) {
                        return g;
                      }
                      return {
                        ...g,
                        iterations: g.iterations.map((existing) => {
                          if (existing.id !== iterId) {
                            return existing;
                          }
                          return {
                            ...existing,
                            height: frame.height || existing.height,
                            html: frame.html || "<p>Failed to generate</p>",
                            isLoading: false,
                            label: frame.label || existing.label,
                            width: frame.width || existing.width,
                          };
                        }),
                      };
                    }),
                  );
                }
              }
            }
          }
        };

        const processLine = (line: string) => {
          const part = parseSSELine(line);
          if (!part) {
            return;
          }

          if (part.type === "data-workflow") {
            const dataPart = part as unknown as DataWorkflowPart;
            const { data } = dataPart;

            mapStepToStages(data.steps);

            if (
              data.status === "success" ||
              data.status === "finished" ||
              data.status === "failed"
            ) {
              const collectStep = data.steps["collectResults"];
              if (collectStep?.output && typeof collectStep.output === "object") {
                workflowOutput = collectStep.output as WorkflowOutput;
              }
            }
          }

          if (part.type === "error") {
            const errorText = (part as { errorText?: string }).errorText ?? "Unknown stream error";
            logger.error("Stream error", { error: errorText });
            for (let i = 0; i < conceptCount; i++) {
              const iterId = iterIds[i];
              if (!iterId || completedFrameIndices.has(i)) {
                continue;
              }

              setPipelineStages((prev) => ({
                ...prev,
                [iterId]: { progress: 0, stage: "error" },
              }));

              setGroups((prev) =>
                prev.map((g) => {
                  if (g.id !== groupId) {
                    return g;
                  }
                  return {
                    ...g,
                    iterations: g.iterations.map((existing) => {
                      if (existing.id !== iterId) {
                        return existing;
                      }
                      return {
                        ...existing,
                        html: `<div style="padding:32px;color:#666;font-family:system-ui">
                          <p style="font-size:14px">⚠ ${errorText}</p>
                        </div>`,
                        isLoading: false,
                      };
                    }),
                  };
                }),
              );
            }
          }

          if (part.type === "abort") {
            setGroups((prev) =>
              prev
                .map((g) => {
                  if (g.id !== groupId) {
                    return g;
                  }
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
                .filter((g) => g.iterations.length > 0),
            );
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (controller.signal.aborted) {
              break;
            }
            processLine(line);
          }
        }

        if (buffer.trim()) {
          processLine(buffer.trim());
        }

        const finalOutput = workflowOutput as WorkflowOutput | null;
        if (finalOutput?.frames) {
          for (let i = 0; i < finalOutput.frames.length; i++) {
            if (completedFrameIndices.has(i)) {
              continue;
            }

            const frame = finalOutput.frames[i];
            const iterId = iterIds[i];
            if (!frame || !iterId) {
              continue;
            }

            setPipelineStages((prev) => ({
              ...prev,
              [iterId]: { progress: 1, stage: "done" },
            }));

            setGroups((prev) =>
              prev.map((g) => {
                if (g.id !== groupId) {
                  return g;
                }
                return {
                  ...g,
                  iterations: g.iterations.map((existing) => {
                    if (existing.id !== iterId) {
                      return existing;
                    }
                    return {
                      ...existing,
                      height: frame.height || existing.height,
                      html: frame.html || "<p>Failed to generate</p>",
                      isLoading: false,
                      label: frame.label || existing.label,
                      width: frame.width || existing.width,
                    };
                  }),
                };
              }),
            );
          }

          if (finalOutput.summary) {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      summary: {
                        rationale: finalOutput.summary ?? "",
                        title: "",
                      },
                    }
                  : g,
              ),
            );
          }
        }

        setGenStatus("Workflow complete");
        const totalDuration = Date.now() - generationStartTimeRef.current;
        const finalWordCount = prompt.split(/\s+/).filter(Boolean).length;
        trackGenerationComplete(model || "unknown", finalWordCount, conceptCount, totalDuration);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") return;

        const msg = error instanceof Error ? error.message : "Workflow failed";
        logger.error("Fatal error", { error: msg });

        const errorType:
          | "auth"
          | "rate_limit"
          | "timeout"
          | "provider_error"
          | "validation"
          | "unknown" =
          msg.includes("401") || msg.includes("403") || msg.includes("unauthorized")
            ? "auth"
            : msg.includes("rate") || msg.includes("429")
              ? "rate_limit"
              : msg.includes("timeout")
                ? "timeout"
                : msg.includes("validation")
                  ? "validation"
                  : msg.includes("fetch") || msg.includes("network")
                    ? "provider_error"
                    : "unknown";
        trackGenerationFailed(errorType, model || "unknown", msg);

        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== groupId) {
              return g;
            }
            return {
              ...g,
              iterations: g.iterations.map((iter) => {
                if (!iter.isLoading) {
                  return iter;
                }
                setPipelineStages((prev) => ({
                  ...prev,
                  [iter.id]: { progress: 0, stage: "error" },
                }));
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
          }),
        );
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [setGroups, setIsGenerating, setPipelineStages, setGenStatus],
  );

  return { abort, startStream };
};
