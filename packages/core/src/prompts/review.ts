export function buildReviewPrompt(
  prompt: string,
  width: number | undefined,
  height: number | undefined,
  strippedHtml: string
): string {
  return `You are a design quality reviewer. Review this HTML/CSS design and fix any issues.

Original request: "${prompt}"
Target size: ${width || "auto"}x${height || "auto"}

Current HTML:
${strippedHtml}

Note: [IMAGE_PLACEHOLDER_N] references are real images — keep all <img> tags and their src attributes exactly as-is.

REVIEW CHECKLIST:
1. Typography — proper hierarchy, readable sizes, good line-height
2. Spacing — consistent padding/margins, nothing cramped
3. Colors — harmonious palette, sufficient contrast
4. Layout — proper alignment, no overflow issues
5. Images — properly sized, good aspect ratios, rounded corners match design
6. Overall polish — does it look professional and intentional?

If the design is good, return it unchanged.
If there are issues, fix them and return the corrected version.

RULES:
- Return ONLY the HTML — no explanation, no markdown, no code fences
- Start with <!--size:WIDTHxHEIGHT--> on the first line
- Keep the same structure and images (don't remove <img> tags)
- No animations, transitions, or hover effects
- Self-contained, no external dependencies`;
}
