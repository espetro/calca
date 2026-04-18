export function buildSummaryPrompt(
  prompt: string,
  strippedHtml: string,
  iterationLabels: string[]
): string {
  return `You are a design critic. Analyze this HTML/CSS design generated for the prompt: "${prompt}".

Design iterations in this group:
${iterationLabels.map((label, i) => `${i + 1}. ${label}`).join('\n')}

HTML/CSS of the final design (base64 images removed):
${strippedHtml}

Provide a concise summary with exactly two fields:
1. TITLE: A 1-2 sentence label describing what this design is (max 80 characters)
2. RATIONALE: Brief explanation of key design choices — color palette, typography, layout approach, visual hierarchy (max 300 characters)

Return ONLY a JSON object in this exact format:
{"title": "...", "rationale": "..."}`;
}
