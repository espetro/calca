import { Mastra } from '@mastra/core'
import { designPipeline } from './design-pipeline.workflow'

export const mastra = new Mastra({
  workflows: {
    designPipeline,
  },
})
