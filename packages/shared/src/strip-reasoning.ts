/**
 * Boundary scrub for model text: strip reasoning blocks (`<think>`,
 * `<reasoning>`, `<thought>`) that some providers emit inline. Applied before
 * any output is parsed or persisted so BYOK providers without structured
 * output cannot leak reasoning into stored HTML or exports. An unclosed
 * trailing block (truncated output) is stripped to EOF.
 */
const REASONING_BLOCK_RE = /<(think|reasoning|thought)(?:\s[^>]*)?>[\s\S]*?(<\/\1>|$)/gi;

export function stripReasoningBlocks(raw: string): string {
  return raw.replace(REASONING_BLOCK_RE, "");
}
