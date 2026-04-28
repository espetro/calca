import { useMutation } from "@tanstack/react-query";

import type { DerivedProviderFields } from "@/features/settings/lib/derive-provider-fields";
import { apiClient } from "@/lib/api-client";

const MUTATION_KEY = ["/api/workflow", "revision"] as const;

interface RevisionOptions {
  revision: string;
  existingHtml: string;
}

interface RevisionInput {
  prompt: string;
  signal: AbortSignal;
  options?: RevisionOptions;
  systemPrompt?: string;
  derived: DerivedProviderFields;
}

interface RevisionOutput {
  html: string;
  label: string;
  width?: number;
  height?: number;
  critique?: string;
  comment?: string;
}

interface RevisionEndpointOutput {
  body: ReadableStream;
}

const getFrames = async (body: ReadableStream, signal: AbortSignal) => {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  let frameResult: RevisionOutput | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (signal.aborted) {
        break;
      }
      if (!line || line.startsWith(":")) {
        continue;
      }

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) {
        continue;
      }

      try {
        const part = JSON.parse(line.slice(colonIdx + 1)) as {
          type: string;
          data?: Record<string, unknown>;
        };
        if (part.type === "data-workflow" && part.data) {
          const steps = part.data.steps as
            | Record<string, { name: string; status: string; output: unknown }>
            | undefined;
          const collectStep = steps?.["collectResults"];
          if (collectStep?.output && typeof collectStep.output === "object") {
            const output = collectStep.output as {
              frames?: RevisionOutput[];
            };
            if (output.frames && output.frames.length > 0 && output.frames[0]) {
              const f = output.frames[0];
              frameResult = {
                ...f,
                html: f.html ?? "",
                label: f.label ?? "Revised",
              };
            }
          }
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  if (!frameResult) {
    throw new Error("No frame result received from workflow");
  }

  return {
    ...frameResult,
    html: frameResult.html ?? "",
    label: frameResult.label ?? "Revised",
  } satisfies RevisionOutput;
};

const postRevision = async ({ prompt, signal, options, derived, systemPrompt }: RevisionInput) => {
  if (!options) {
    throw new Error("Revision requires options");
  }

  const response = await apiClient.api.workflow.$post({
    json: {
      apiKey: derived.apiKey || undefined,
      baseURL: derived.baseURL || undefined,
      conceptCount: 1,
      existingHtml: options.existingHtml,
      mode: "quick",
      model: derived.model,
      prompt,
      providerType: derived.providerType || undefined,
      revision: options.revision,
      systemPrompt,
    },
    signal,
  });
  const { body } = response;

  if (!body) {
    throw new Error("No response body");
  }

  return await getFrames(body, signal);
};

const usePostRevision = () =>
  useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: postRevision,
  });

export default usePostRevision;
