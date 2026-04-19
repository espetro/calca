import { Mastra } from '@mastra/core'

// Placeholder workflow - will be replaced with actual design pipeline
const placeholderWorkflow = {
  id: 'design-pipeline',
  execute: async () => ({ status: 'placeholder' as const }),
}

export const mastra = new Mastra({
  workflows: {
    designPipeline: placeholderWorkflow,
  },
})
