import { Mastra } from '@mastra/core'
import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'

const placeholderStep = createStep({
  id: 'placeholder',
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ status: z.string() }),
  execute: async () => ({ status: 'placeholder' }),
})

const placeholderWorkflow = createWorkflow({
  id: 'design-pipeline',
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({ status: z.string() }),
})
  .then(placeholderStep)
  .commit()

export const mastra = new Mastra({
  workflows: {
    designPipeline: placeholderWorkflow,
  },
})
