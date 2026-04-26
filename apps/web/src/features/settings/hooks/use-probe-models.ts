import { useMutation } from "@tanstack/react-query";
import type { ModelInfo } from "../types";
import { FALLBACK_MODELS } from "../types";
import { legacyApiClient } from "@/lib/services/api";

const MUTATION_KEY = ["/api/probe-models"] as const;

interface ProbeModelsInput {
  apiKey?: string;
  providerType: string;
  baseURL?: string;
}

interface ProbeModelsOutput {
  models: ModelInfo[];
  error?: string;
}

interface ProbeModelsEndpointOutput {
  available: Record<string, boolean> | undefined;
}

const probeModels = async (input: ProbeModelsInput): Promise<ProbeModelsOutput> => {
  try {
    const { available } = await legacyApiClient<ProbeModelsEndpointOutput>("/api/probe-models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!available) {
      return { models: FALLBACK_MODELS };
    }

    const models: ModelInfo[] = Object.entries(available)
      // TODO move this filter to the server
      .filter(([, isAvailable]) => isAvailable)
      .map(([id]) => ({ id, displayName: id, description: "" }));

    if (models.length === 0) {
      return { models: FALLBACK_MODELS };
    }

    return { models };
  } catch (error) {
    return {
      models: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const useProbeModels = () =>
  useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: probeModels,
  });
