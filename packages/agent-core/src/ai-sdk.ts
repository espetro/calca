import { stepCountIs, ToolLoopAgent } from "ai";

import type { AgentHarness, HarnessRunInput } from "./harness.js";

const DEFAULT_MAX_STEPS = 16;

export const aiSdkHarness = (): AgentHarness => ({
  async *stream({ agent, model, messages, capabilities, signal }: HarnessRunInput) {
    const sdk = new ToolLoopAgent({
      model,
      instructions: agent.instructions,
      tools: agent.tools,
      stopWhen: stepCountIs(agent.maxSteps ?? DEFAULT_MAX_STEPS),
      experimental_context: capabilities,
    });
    const result = await sdk.stream({ messages, abortSignal: signal });
    yield* result.fullStream;
  },
});
