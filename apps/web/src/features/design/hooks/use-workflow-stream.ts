import { useCallback, useRef } from "react";
import { useSetAtom } from "jotai";
import { getLogger } from "@app/logger";
import { groupsAtom } from "@/features/design/state/groups-atoms";
import {
  isGeneratingAtom,
  pipelineStagesAtom,
  genStatusAtom,
} from "@/features/design/state/generation-atoms";
import type { GenerationGroup, PipelineStage, Point } from "@/shared/types";
import { legacyApiClient } from "@/lib/services/api";

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
  plan: { stage: "layout", progress: 0.1 },
  frameOrchestrator: { stage: "layout", progress: 0.2 },
  summary: { stage: "refining", progress: 0.95 },
  collectResults: { stage: "refining", progress: 0.98 },
};

const parseSSELine = (line: string): { type: string; [key: string]: unknown } | null => {
  if (!line || line.startsWith(":")) return null;

  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;

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

      const newGroup: GenerationGroup = {
        id: groupId,
        prompt,
        iterations: [],
        position: positions[0],
        createdAt: Date.now(),
      };
      setGroups((prev) => [...prev, newGroup]);

      const iterIds: string[] = [];
      for (let i = 0; i < conceptCount; i++) {
        const iterId = `${groupId}-iter-${i}`;
        iterIds.push(iterId);

        setPipelineStages((prev) => ({
          ...prev,
          [iterId]: { stage: "queued", progress: 0 },
        }));
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            iterations: iterIds.map((iterId, i) => ({
              id: iterId,
              html: "",
              label: `Variation ${i + 1}`,
              position: positions[i],
              width: 400,
              height: 300,
              prompt,
              comments: [],
              isLoading: true,
            })),
          };
        }),
      );

      try {
        const { body } = await legacyApiClient<{ body: ReadableStream }>("/api/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            mode,
            conceptCount,
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
          }),
          signal: controller.signal,
        });

        if (!body) throw new Error("No response body");

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let workflowOutput: WorkflowOutput | null = null;
        const completedFrameIndices = new Set<number>();

        const mapStepToStages = (steps: Record<string, WorkflowStepResult>) => {
          for (const [, stepResult] of Object.entries(steps)) {
            const stepName = stepResult.name;
            const mapping = STEP_STAGE_MAP[stepName];

            if (!mapping) continue;

            if (stepResult.status === "running") {
              for (let i = 0; i < conceptCount; i++) {
                const iterId = iterIds[i];
                if (!iterId) continue;

                setPipelineStages((prev) => {
                  const existing = prev[iterId];
                  if (existing && (existing.stage === "done" || existing.stage === "error")) {
                    return prev;
                  }
                  return {
                    ...prev,
                    [iterId]: {
                      stage: mapping.stage,
                      progress: mapping.progress + (i / conceptCount) * 0.15,
                    },
                  };
                });
              }

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
                for (let i = 0; i < output.frames.length; i++) {
                  if (completedFrameIndices.has(i)) continue;

                  const frame = output.frames[i];
                  if (!frame) continue;

                  const iterId = iterIds[i];
                  if (!iterId) continue;

                  completedFrameIndices.add(i);

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
                            html: frame.html || "<p>Failed to generate</p>",
                            label: frame.label || existing.label,
                            width: frame.width || existing.width,
                            height: frame.height || existing.height,
                            isLoading: false,
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
          if (!part) return;

          if (part.type === "data-workflow") {
            const dataPart = part as unknown as DataWorkflowPart;
            const data = dataPart.data;

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
            getLogger(["calca", "web", "design", "stream"]).error("Stream error", { error: errorText });
            for (let i = 0; i < conceptCount; i++) {
              const iterId = iterIds[i];
              if (!iterId || completedFrameIndices.has(i)) continue;

              setPipelineStages((prev) => ({
                ...prev,
                [iterId]: { stage: "error", progress: 0 },
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
                .filter((g) => g.iterations.length > 0),
            );
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (controller.signal.aborted) break;
            processLine(line);
          }
        }

        if (buffer.trim()) {
          processLine(buffer.trim());
        }

        const finalOutput = workflowOutput as WorkflowOutput | null;
        if (finalOutput?.frames) {
          for (let i = 0; i < finalOutput.frames.length; i++) {
            if (completedFrameIndices.has(i)) continue;

            const frame = finalOutput.frames[i];
            const iterId = iterIds[i];
            if (!frame || !iterId) continue;

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
                      html: frame.html || "<p>Failed to generate</p>",
                      label: frame.label || existing.label,
                      width: frame.width || existing.width,
                      height: frame.height || existing.height,
                      isLoading: false,
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
                        title: "",
                        rationale: finalOutput.summary ?? "",
                      },
                    }
                  : g,
              ),
            );
          }
        }

        setGenStatus("Workflow complete");
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        const msg = err instanceof Error ? err.message : "Workflow failed";
        getLogger(["calca", "web", "design", "stream"]).error("Fatal error", { error: msg });

        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              iterations: g.iterations.map((iter) => {
                if (!iter.isLoading) return iter;
                setPipelineStages((prev) => ({
                  ...prev,
                  [iter.id]: { stage: "error", progress: 0 },
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

  return { startStream, abort };
};
