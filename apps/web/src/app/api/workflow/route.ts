import { handleWorkflowStream } from '@mastra/ai-sdk'
import { createUIMessageStreamResponse } from 'ai'
import { mastra } from '../../../features/design/workflows/mastra'

export const maxDuration = 300

export async function POST(request: Request) {
  const params = await request.json()

  const stream = await handleWorkflowStream({
    mastra,
    workflowId: 'designPipeline',
    params,
    version: 'v6',
  })

  return createUIMessageStreamResponse({ stream })
}
