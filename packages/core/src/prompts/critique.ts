export function buildCritiquePrompt(prompt: string, strippedHtml: string): string {
  return `You are a design critic. Analyze this HTML/CSS design and provide specific, actionable feedback for improving the NEXT variation.

Original request: "${prompt}"

HTML:
${strippedHtml}

Provide 3-5 bullet points of specific improvements. Focus on:
- What works well (keep this in the next variation)
- What could be better (typography, spacing, color, layout)
- A different creative direction to try

Be specific and concise. This feedback will be injected into the next generation prompt.`;
}
