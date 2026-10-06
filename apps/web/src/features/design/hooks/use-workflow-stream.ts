import { getLogger } from "@app/logger";
import { validateSummary } from "@app/shared";
import { groupsAtom } from "@calca/canvas-flow";
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
  genStartedAtAtom,
  genStatusAtom,
} from "#/features/design/state/generation-atoms";
import { apiClient, apiErrorMessage } from "#/lib/api-client";
import type {
  GenerationGroup,
  PipelineStage,
  PipelineStepName,
  PipelineStepState,
  Point,
} from "#/shared/types";
import { PIPELINE_STEP_ORDER } from "#/shared/types";

// ── Wire types ───────────────────────────────────────────────────────────────
// Mastra handleWorkflowStream emits `data-workflow` SSE parts per
// AI SDK v6 UIMessageStream wire protocol: each line is `<index>:<json>\n`.

interface WorkflowStepResult {
  name: string;
  status: string;
  /** Present on per-frame step events (layout/images/review/critique/frameComplete). */
  frameIndex?: number;
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
  summary?: unknown;
}

// The wire summary is the {title, rationale} object; tolerate a JSON-encoded
// string so an older API bundle still renders. Anything else degrades to no
// summary rather than surfacing raw model text in the UI.
const parseSummaryOutput = (raw: unknown): { title: string; rationale: string } | undefined => {
  const candidate = typeof raw === "string" ? safeJsonParse(raw) : raw;
  if (!candidate) {
    return undefined;
  }
  try {
    return validateSummary(candidate);
  } catch {
    return undefined;
  }
};

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** Wire step name → user-facing status text (running transitions only). */
const STEP_STATUS_LABELS: Record<string, string> = {
  collectResults: "Wrapping up",
  critique: "Writing critique",
  frameOrchestrator: "Processing frames",
  images: "Adding images",
  layout: "Generating layout",
  plan: "Planning concepts",
  review: "Reviewing design",
  summary: "Summarizing results",
};

/** Wire step name → progress-bar stage bucket (keeps STAGE_CONFIG/pulse behavior). */
const STEP_TO_STAGE: Record<PipelineStepName, PipelineStage> = {
  critique: "refining",
  images: "images",
  layout: "layout",
  plan: "queued",
  review: "review",
};

const isFrameStepName = (name: string): name is PipelineStepName =>
  (PIPELINE_STEP_ORDER as string[]).includes(name);

const normalizeStepStatus = (status: string): "running" | "success" | "failed" | null => {
  if (status === "running") {
    return "running";
  }
  if (status === "success" || status === "finished") {
    return "success";
  }
  if (status === "failed") {
    return "failed";
  }
  return null;
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
  /** Source iteration label when this stream is a remix — keeps lineage in the new frame's label. */
  remixOf?: string;
}

export const useWorkflowStream = () => {
  const setGroups = useSetAtom(groupsAtom);
  const setIsGenerating = useSetAtom(isGeneratingAtom);
  const setPipelineStages = useSetAtom(pipelineStagesAtom);
  const setGenStatus = useSetAtom(genStatusAtom);
  const setGenStartedAt = useSetAtom(genStartedAtAtom);

  const abortRef = useRef<AbortController | null>(null);
  const generationStartTimeRef = useRef<number>(0);
  const completedStepsRef = useRef<Set<string>>(new Set());
  // Per-iteration step states (iterId -> step name -> state), rebuilt per stream.
  const frameStepsRef = useRef<Map<string, Map<PipelineStepName, PipelineStepState>>>(new Map());

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
        remixOf,
      } = params;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsGenerating(true);
      setGenStatus("Starting workflow…");
      setGenStartedAt(Date.now());

      generationStartTimeRef.current = Date.now();
      completedStepsRef.current = new Set();
      frameStepsRef.current = new Map();

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

      const frameStepNames: PipelineStepName[] =
        mode === "quick"
          ? ["plan", "layout", "images"]
          : ["plan", "layout", "images", "review", "critique"];

      const iterIds: string[] = [];
      for (let i = 0; i < conceptCount; i++) {
        const iterId = `${groupId}-iter-${i}`;
        iterIds.push(iterId);

        frameStepsRef.current.set(
          iterId,
          new Map(frameStepNames.map((name) => [name, { status: "pending" as const }])),
        );
        setPipelineStages((prev) => ({
          ...prev,
          [iterId]: {
            progress: 0,
            stage: "queued",
            steps: Object.fromEntries(
              frameStepNames.map((name) => [name, { status: "pending" as const }]),
            ),
          },
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
              label: remixOf
                ? conceptCount > 1
                  ? `Remix ${i + 1} of ${remixOf}`
                  : `Remix of ${remixOf}`
                : `v${i + 1}`,
              position: positions[i],
              prompt,
              width: 400,
            })),
          };
        }),
      );

      const snapshotSteps = (iterId: string) => {
        const steps = frameStepsRef.current.get(iterId);
        if (!steps) {
          return undefined;
        }
        const snapshot: Partial<Record<PipelineStepName, PipelineStepState>> = {};
        steps.forEach((state, name) => {
          snapshot[name] = { ...state };
        });
        return snapshot;
      };

      const removePendingIterations = () => {
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
      };

      try {
        const response = await apiClient.api.workflow.$post(
          {
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
          },
          { init: { signal: controller.signal } },
        );

        if (!response.ok) {
          throw new Error(await apiErrorMessage(response, "Workflow request failed"));
        }

        const { body } = response;

        if (!body) {
          throw new Error("No response body");
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let workflowOutput: WorkflowOutput | null = null;
        const completedFrameIndices = new Set<number>();

        /** Recompute and publish one iteration's PipelineStatus from its step map. */
        const publishStage = (iterId: string) => {
          const steps = snapshotSteps(iterId);
          if (!steps) {
            return;
          }
          const ordered = PIPELINE_STEP_ORDER.filter((name) => steps[name]);
          const doneCount = ordered.filter((name) => steps[name]?.status === "success").length;
          const running = ordered.find((name) => steps[name]?.status === "running");
          const lastActive = [...ordered].reverse().find((name) => {
            const s = steps[name];
            return s !== undefined && s.status !== "pending";
          });
          const stage: PipelineStage = running
            ? STEP_TO_STAGE[running]
            : lastActive
              ? STEP_TO_STAGE[lastActive]
              : "queued";
          const progress = ordered.length
            ? Math.min(0.98, (doneCount + (running ? 0.5 : 0)) / ordered.length)
            : 0;

          setPipelineStages((prev) => {
            const existing = prev[iterId];
            if (existing && (existing.stage === "done" || existing.stage === "error")) {
              return prev;
            }
            return {
              ...prev,
              [iterId]: { ...existing, progress, stage, steps },
            };
          });
        };

        const applyStep = (
          iterId: string,
          name: PipelineStepName,
          status: "running" | "success" | "failed",
        ) => {
          const steps = frameStepsRef.current.get(iterId);
          const step = steps?.get(name);
          if (
            !step ||
            step.status === status ||
            step.status === "success" ||
            step.status === "failed"
          ) {
            return;
          }
          const now = Date.now();
          if (status === "running") {
            step.status = "running";
            step.startedAt = now;
          } else {
            step.status = status;
            step.elapsedMs = step.startedAt ? now - step.startedAt : undefined;
          }
          publishStage(iterId);
        };

        /** Mark a frame's iteration done and mount its HTML — used by
         *  frameComplete events and the end-of-stream fallbacks. */
        const completeFrame = (index: number, frame: FrameResult) => {
          const iterId = iterIds[index];
          if (!iterId || completedFrameIndices.has(index)) {
            return;
          }
          completedFrameIndices.add(index);

          // Steps still "running" when the frame lands = the step that failed.
          frameStepsRef.current.get(iterId)?.forEach((step) => {
            if (step.status === "running") {
              step.status = "failed";
            }
          });

          setPipelineStages((prev) => ({
            ...prev,
            [iterId]: { progress: 1, stage: "done", steps: snapshotSteps(iterId) },
          }));

          trackPipelineStageComplete("layout", iterId, Date.now() - generationStartTimeRef.current);

          setGenStatus(`${completedFrameIndices.size} of ${conceptCount} variations ready`);

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
                    // Pipeline emits only generic "Variation N" — keep
                    // our lineage-aware label unless a real name arrives.
                    label: /^Variation \d+$/.test(frame.label)
                      ? existing.label
                      : frame.label || existing.label,
                    width: frame.width || existing.width,
                  };
                }),
              };
            }),
          );
        };

        const mapStepToStages = (steps: Record<string, WorkflowStepResult>) => {
          for (const [, stepResult] of Object.entries(steps)) {
            const stepName = stepResult.name;
            const frameIndex =
              typeof stepResult.frameIndex === "number" ? stepResult.frameIndex : undefined;
            const status = normalizeStepStatus(stepResult.status);

            // Per-frame completion carries the finished FrameResult — mount early.
            if (stepName === "frameComplete") {
              if (
                frameIndex !== undefined &&
                (stepResult.status === "success" || stepResult.status === "finished") &&
                stepResult.output &&
                typeof stepResult.output === "object"
              ) {
                completeFrame(frameIndex, stepResult.output as FrameResult);
              }
              continue;
            }

            // Per-frame step events carry frameIndex → attribute to one iteration.
            if (frameIndex !== undefined) {
              const iterId = iterIds[frameIndex];
              if (!iterId || !isFrameStepName(stepName) || !status) {
                continue;
              }
              if (status === "running") {
                if (!completedStepsRef.current.has(`${iterId}:${stepName}`)) {
                  completedStepsRef.current.add(`${iterId}:${stepName}`);
                  trackPipelineStageStart(STEP_TO_STAGE[stepName], iterId);
                }
                const label = STEP_STATUS_LABELS[stepName];
                if (label) {
                  setGenStatus(`${label} · variation ${frameIndex + 1} of ${conceptCount}`);
                }
              }
              applyStep(iterId, stepName, status);
              continue;
            }

            // Global (frame-less) steps.
            if (stepName === "plan" && status) {
              for (const iterId of iterIds) {
                applyStep(iterId, "plan", status);
              }
            }
            if (status === "running") {
              const label = STEP_STATUS_LABELS[stepName];
              if (label) {
                setGenStatus(`${label}…`);
              }
            }

            // Catch-all: frames that never emitted frameComplete (e.g. errorFrame).
            if (
              stepName === "frameOrchestrator" &&
              (stepResult.status === "success" || stepResult.status === "finished") &&
              stepResult.output
            ) {
              const output = stepResult.output as { frames?: FrameResult[] };
              if (output.frames && Array.isArray(output.frames)) {
                for (let i = 0; i < output.frames.length; i++) {
                  const frame = output.frames[i];
                  if (frame) {
                    completeFrame(i, frame);
                  }
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

              frameStepsRef.current.get(iterId)?.forEach((step) => {
                if (step.status === "running") {
                  step.status = "failed";
                }
              });
              setPipelineStages((prev) => ({
                ...prev,
                [iterId]: { progress: 0, stage: "error", steps: snapshotSteps(iterId) },
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
            removePendingIterations();
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
            const frame = finalOutput.frames[i];
            if (frame) {
              completeFrame(i, frame);
            }
          }

          const summary = parseSummaryOutput(finalOutput.summary);
          if (summary) {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      summary: { rationale: summary.rationale, title: summary.title },
                    }
                  : g,
              ),
            );
          }
        }

        // Drop placeholder iterations that never received a frame (e.g. plan
        // produced fewer concepts than requested) — same cleanup as an abort.
        removePendingIterations();

        setGenStatus("Workflow complete");
        const totalDuration = Date.now() - generationStartTimeRef.current;
        const finalWordCount = prompt.split(/\s+/).filter(Boolean).length;
        trackGenerationComplete(model || "unknown", finalWordCount, conceptCount, totalDuration);
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          removePendingIterations();
          setGenStatus("Generation canceled");
          return;
        }

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
                frameStepsRef.current.get(iter.id)?.forEach((step) => {
                  if (step.status === "running") {
                    step.status = "failed";
                  }
                });
                setPipelineStages((prev) => ({
                  ...prev,
                  [iter.id]: { progress: 0, stage: "error", steps: snapshotSteps(iter.id) },
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
    [setGroups, setIsGenerating, setPipelineStages, setGenStatus, setGenStartedAt],
  );

  return { abort, startStream };
};
