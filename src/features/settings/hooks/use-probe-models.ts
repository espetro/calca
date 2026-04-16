import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import type { ModelInfo } from "../types"
import { FALLBACK_MODELS } from "../types"

interface ProbeModelsInput {
  apiKey?: string
  providerType: string
  baseURL?: string
}

interface ProbeModelsOutput {
  models: ModelInfo[]
  error?: string
}

export const useProbeModels = (): UseMutationResult<
  ProbeModelsOutput,
  Error,
  ProbeModelsInput
> =>
  useMutation({
    mutationFn: async (input: ProbeModelsInput): Promise<ProbeModelsOutput> => {
      try {
        const res = await fetch("/api/probe-models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: input.apiKey,
            providerType: input.providerType,
            baseURL: input.baseURL,
          }),
        })

        if (!res.ok) {
          const text = await res.text()
          return { models: [], error: text || `HTTP ${res.status}` }
        }

        const data = await res.json()
        const available = data.available as
          | Record<string, boolean>
          | undefined

        if (!available) {
          return { models: FALLBACK_MODELS }
        }

        const models: ModelInfo[] = Object.entries(available)
          .filter(([, isAvailable]) => isAvailable)
          .map(([id]) => ({ id, displayName: id, description: "" }))

        if (models.length === 0) {
          return { models: FALLBACK_MODELS }
        }

        return { models }
      } catch (error) {
        return {
          models: [],
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
  })
