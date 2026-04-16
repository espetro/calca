import { useMutation } from "@tanstack/react-query";

interface PlanConceptsInput {
  prompt: string;
  count: number;
  apiKey?: string;
  model?: string;
  providerType?: string;
  baseURL?: string;
  signal?: AbortSignal;
}

interface PlanConceptsOutput {
  concepts: string[];
}

const fetchPlanConcepts = async ({ count, signal, ...input }: PlanConceptsInput) => {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Plan request failed: ${res.status}`);
  }

  const data = await res.json();
  return { concepts: (data.concepts || []).slice(0, count) } satisfies PlanConceptsOutput;
};

export const usePlanConcepts = () => {
  return useMutation({
    mutationFn: fetchPlanConcepts,
  });
};
