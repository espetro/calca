import { generateText } from 'ai';
import { getClaudeModel } from './providers';

const MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-5',
  'claude-opus-4',
  'claude-sonnet-4',
];

function isNotFoundError(msg: string): boolean {
  return (
    msg.includes('not_found') ||
    msg.includes('404') ||
    msg.includes('Could not resolve') ||
    msg.includes('does not exist')
  );
}

export async function probeModels(apiKey: string): Promise<Record<string, boolean>> {
  const headers: Record<string, string> = { 'x-anthropic-key': apiKey };
  const available: Record<string, boolean> = {};

  for (const model of MODELS) {
    try {
      await generateText({
        model: getClaudeModel(model),
        maxOutputTokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
        headers,
      });
      available[model] = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`Probe ${model}:`, msg);

      // Only mark unavailable for definitive "not found" errors
      if (isNotFoundError(msg)) {
        available[model] = false;
      } else {
        // Rate limit, overloaded, timeout, or any other error — assume available
        available[model] = true;
      }
    }
  }

  return available;
}
