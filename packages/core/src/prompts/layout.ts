/** Strip base64 data URIs from HTML — local helper for prompt builders */
function stripBase64Images(html: string): {
  stripped: string;
  restore: (output: string) => string;
} {
  const images: string[] = [];
  const stripped = html.replace(/src="(data:image\/[^"]+)"/g, (_match, dataUri) => {
    const idx = images.length;
    images.push(dataUri);
    return `src="[IMAGE_PLACEHOLDER_${idx}]"`;
  });
  const restore = (output: string): string => {
    let result = output;
    for (let i = 0; i < images.length; i++) {
      result = result.replace(`[IMAGE_PLACEHOLDER_${i}]`, images[i]);
    }
    return result;
  };
  return { restore, stripped };
}

export function buildRevisionPrompt(
  systemPrompt: string | undefined,
  existingHtml: string,
  prompt: string,
  revision: string,
): string {
  const customBlock = systemPrompt
    ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${systemPrompt}\n`
    : "";
  const { stripped, restore } = stripBase64Images(existingHtml);

  return (
    JSON.stringify({ restoreNeeded: true, stripped }) +
    "\n---PROMPT---\n" +
    `You are a world-class visual designer. You are EDITING an existing design — not creating a new one.${customBlock}

Here is the EXISTING HTML design:

${stripped}

Note: [IMAGE_PLACEHOLDER_N] references are real images — keep all <img> tags and their src attributes exactly as-is.

The original request was: "${prompt}"

The user wants this specific change: "${revision}"

CRITICAL RULES:
- Return exactly ONE design — the existing design with ONLY the requested change applied
- Do NOT generate multiple variations, alternatives, or options
- Do NOT stack multiple versions vertically or horizontally
- PRESERVE the existing layout, structure, and content
- ONLY modify what was specifically requested — change nothing else

IMAGE PLACEHOLDERS — where the design needs a NEW photo/visual (only if the revision requires new imagery):
- Use: <div data-placeholder="DESCRIPTION" data-ph-w="WIDTH" data-ph-h="HEIGHT" class="w-[WIDTHpx] h-[HEIGHTpx] bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden">
    <span class="text-gray-400 text-xs text-center p-2">DESCRIPTION</span>
  </div>
- Keep any existing <img> tags as-is unless the revision specifically asks to change them

ABSOLUTELY NO MOTION — no CSS animations, transitions, @keyframes, hover effects.

SIZE — output a size comment on the FIRST line:
<!--size:WIDTHxHEIGHT-->

TAILWIND CSS — USE UTILITY CLASSES:
- Apply ALL styling via Tailwind utility classes on the class attribute (e.g., class="p-4 bg-blue-500 rounded-lg shadow-md")
- Do NOT use <style> tags — everything must be Tailwind classes
- Use arbitrary value syntax for custom values: bg-[#hex], w-[Npx], text-[Npx], etc.
- Small inline styles are acceptable ONLY for truly dynamic values that cannot be expressed in Tailwind

OUTPUT: HTML only — no explanation, no markdown, no code fences. ALL styling via Tailwind utility classes — NO <style> tags.`
  );
}

export function buildNewPrompt(
  systemPrompt: string | undefined,
  critique: string | undefined,
  prompt: string,
  style: string,
  availableSources: string[],
): string {
  const critiqueBlock = critique
    ? `\n\nIMPROVEMENT FEEDBACK from previous variation (apply these learnings):\n${critique}\n`
    : "";
  const customBlock = systemPrompt
    ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${systemPrompt}\n`
    : "";

  return `You are a world-class visual designer. Generate a stunning HTML design using Tailwind CSS utility classes.${customBlock}${critiqueBlock}

Design request: "${prompt}"
Style direction: ${style}

⚠️ MANDATORY IMAGE PLACEHOLDERS — YOU MUST INCLUDE THESE:
Every design MUST contain at least 1-3 image placeholder divs. This is NON-NEGOTIABLE.
Do NOT use colored boxes, CSS gradients, or background-image as substitutes for real imagery.
Do NOT use <img> tags with URLs. Use ONLY placeholder divs in this EXACT format:

<div data-placeholder="DESCRIPTION" data-ph-w="WIDTH" data-ph-h="HEIGHT" data-img-source="SOURCE" data-img-query="SEARCH_TERMS" class="w-[WIDTHpx] h-[HEIGHTpx] bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden">
  <span class="text-gray-400 text-xs text-center p-2">DESCRIPTION</span>
</div>

REQUIRED ATTRIBUTES on every placeholder:
- data-placeholder = detailed image description/prompt
- data-ph-w / data-ph-h = pixel dimensions that fit the layout
- data-img-source = which image API to use: "unsplash", "dalle", or "gemini"
- data-img-query = SHORT search keywords for Unsplash (3-5 words max)

${
  availableSources && availableSources.length > 0
    ? `AVAILABLE IMAGE SOURCES (choose the best one for each placeholder):
${availableSources.includes("unsplash") ? '- "unsplash" — BEST for real photographs\n' : ""}${availableSources.includes("dalle") ? '- "dalle" — BEST for custom illustrations, abstract art\n' : ""}${availableSources.includes("gemini") ? '- "gemini" — BEST for design assets, UI elements\n' : ""}
Choose the source that best matches what each placeholder needs.`
    : 'Set data-img-source="gemini" for all placeholders (only source available).'
}

Rules:
- Include 1-6 placeholders per design
- Use CSS gradients ONLY for decorative/abstract accents, NOT as replacements for photographs
- All data attributes are REQUIRED

SIZE — output a size comment on the FIRST line:
<!--size:WIDTHxHEIGHT-->

TAILWIND CSS — USE UTILITY CLASSES:
- Apply ALL styling via Tailwind utility classes on the class attribute (e.g., class="p-4 bg-blue-500 rounded-lg shadow-md")
- Do NOT use <style> tags — everything must be Tailwind classes
- Use arbitrary value syntax for custom values: bg-[#hex], w-[Npx], text-[Npx], etc.
- Use Tailwind v4 syntax (standard utility classes)
- Small inline styles are acceptable ONLY for truly dynamic values that cannot be expressed in Tailwind (e.g., CSS custom properties, calc() expressions)

DESIGN QUALITY RULES:
- Rich color palettes, gradients, accent colors
- Strong typography hierarchy (text-5xl/text-7xl headlines, text-sm/body)
- Visual texture: layered shadows, glassmorphism, patterns
- System font stack: font-sans (Tailwind's default)

ABSOLUTELY NO MOTION:
- No CSS animations, transitions, @keyframes, hover effects

OUTPUT:
- First line: <!--size:WIDTHxHEIGHT-->
- Then HTML only — no explanation, no markdown, no code fences
- ALL styling via Tailwind utility classes — NO <style> tags
- Self-contained, no external dependencies
- Generate exactly ONE design`;
}

/**
 * Builds the user content for the revision path in handleLayout.
 * Receives already-stripped HTML (caller handles base64 stripping).
 */
export function buildRevisionUserContent(
  systemPrompt: string | undefined,
  strippedHtml: string,
  prompt: string,
  revision: string,
): string {
  const customBlock = systemPrompt
    ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${systemPrompt}\n`
    : "";
  return `You are a world-class visual designer. You are EDITING an existing design — not creating a new one.${customBlock}

Here is the EXISTING HTML design:

${strippedHtml}

Note: [IMAGE_PLACEHOLDER_N] references are real images — keep all <img> tags and their src attributes exactly as-is.

The original request was: "${prompt}"

The user wants this specific change: "${revision}"

CRITICAL RULES:
- Return exactly ONE design — the existing design with ONLY the requested change applied
- Do NOT generate multiple variations, alternatives, or options
- Do NOT stack multiple versions vertically or horizontally
- PRESERVE the existing layout, structure, and content
- ONLY modify what was specifically requested — change nothing else

IMAGE PLACEHOLDERS — where the design needs a NEW photo/visual (only if the revision requires new imagery):
- Use: <div data-placeholder="DESCRIPTION" data-ph-w="WIDTH" data-ph-h="HEIGHT" class="w-[WIDTHpx] h-[HEIGHTpx] bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden">
    <span class="text-gray-400 text-xs text-center p-2">DESCRIPTION</span>
  </div>
- Keep any existing <img> tags as-is unless the revision specifically asks to change them

ABSOLUTELY NO MOTION — no CSS animations, transitions, @keyframes, hover effects.

SIZE — output a size comment on the FIRST line:
<!--size:WIDTHxHEIGHT-->

TAILWIND CSS — USE UTILITY CLASSES:
- Apply ALL styling via Tailwind utility classes on the class attribute (e.g., class="p-4 bg-blue-500 rounded-lg shadow-md")
- Do NOT use <style> tags — everything must be Tailwind classes
- Use arbitrary value syntax for custom values: bg-[#hex], w-[Npx], text-[Npx], etc.
- Small inline styles are acceptable ONLY for truly dynamic values that cannot be expressed in Tailwind

DESIGNER COMMENT — on the LAST line, add a brief comment about what you did:
<!--otto:Your brief, friendly comment here-->
Examples:
- <!--otto:Centered the pool section and balanced the spacing on both sides.-->
- <!--otto:Wasn't sure if you meant the icon or the text — I adjusted both. Let me know!-->
- <!--otto:Done! You might also want to bump up the font size on the headers to match.-->

Keep it to 1-2 short sentences. Be helpful, specific, and conversational — like a design teammate.

OUTPUT: HTML only — no explanation, no markdown, no code fences. ALL styling via Tailwind utility classes — NO <style> tags.`;
}
