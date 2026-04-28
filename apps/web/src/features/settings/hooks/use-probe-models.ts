import { useMutation } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

import type { ModelInfo } from "../types";

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
    const response = await apiClient.api["probe-models"].$post({
      json: input,
    });
    const data = await response.json();
    if ("error" in data) {
      return { error: data.error, models: [] };
    }
    const { available } = data;

    if (!available) {
      return { models: [] };
    }

    const models: ModelInfo[] = Object.entries(available)
      // TODO move this filter to the server
      .filter(([, isAvailable]) => isAvailable)
      .map(([id]) => ({ description: "", displayName: id, id }));

    return { models };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      models: [],
    };
  }
};

export const useProbeModels = () =>
  useMutation({
    mutationFn: probeModels,
    mutationKey: MUTATION_KEY,
  });
