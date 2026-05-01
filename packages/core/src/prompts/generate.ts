export const VARIATION_STYLES = [
  "Refined and premium — think Stripe or Linear. Subtle gradients, generous whitespace, sophisticated color palette, polished micro-details",
  "Bold and expressive — vibrant colors, large confident typography, strong visual hierarchy, creative use of shapes and color blocks",
  "Warm and approachable — friendly rounded shapes, warm color palette, inviting feel, natural and human-centered",
  "Dark and dramatic — dark backgrounds, glowing accents, cinematic feel, high contrast, moody atmosphere",
];

export interface ViewportDimensions {
  width: number;
  height: number;
}

export function buildVariationPrompt(
  prompt: string,
  style: string,
  systemPrompt?: string,
  viewport?: ViewportDimensions,
): string {
  const customInstructions = systemPrompt
    ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${systemPrompt}\n`
    : "";
  const aspectRatio = viewport ? `${(viewport.width / viewport.height).toFixed(2)}:1` : null;
  const viewportHint = viewport
    ? `\nVIEWPORT: The design will be displayed in a frame that is ${viewport.width}px wide and ${viewport.height}px tall (aspect ratio ~${aspectRatio}). Your design MUST match this aspect ratio. Set <!--size:WIDTHxHEIGHT--> to ${viewport.width}x${viewport.height}.\n`
    : "";
  const sizeConstraint = viewport
    ? `IMPORTANT: Match the viewport aspect ratio (${viewport.width}x${viewport.height}). The <!--size:WIDTHxHEIGHT--> comment MUST be ${viewport.width}x${viewport.height}.\n`
    : "";

  return `You are a world-class visual designer. Generate a stunning, self-contained HTML/CSS design.${customInstructions}

Design request: "${prompt}"
Style direction: ${style}
${viewportHint}
FIRST, determine the design category:
- MARKETING (social media cards, banners, ads, email headers, OG images) → Focus on visual impact, bold typography, abstract/decorative graphics via CSS. NO buttons, NO forms, NO interactive elements. Think poster design, not web UI.
- UI COMPONENT (navbars, forms, modals, cards, settings panels) → Focus on usability, clean layout, proper interactive patterns.
- FULL PAGE (landing pages, dashboards, pricing pages, blog layouts) → Full composition with sections, proper information hierarchy.

SIZE — output a size comment on the FIRST line:
<!--size:WIDTHxHEIGHT-->

${sizeConstraint}Size guidelines (use these only when no viewport dimensions are provided):
- Social media card/banner: 1200x630
- Instagram post: 1080x1080
- Navigation bar: 1200x70
- Hero section: 1200x600
- Card component: 380x420
- Modal/dialog: 500x380
- Full page: 1200x800
- Dashboard: 1200x700
- Email header: 600x300

DESIGN QUALITY RULES:
- Create CSS-only decorative elements: gradients, radial-gradient circles, box-shadows for glows, border-radius shapes, pseudo-elements for abstract graphics
- Use rich color palettes — not just gray/blue. Think gradients, accent colors, complementary tones
- Typography matters: vary font sizes dramatically for hierarchy (48-72px headlines, 14-16px body)
- Add visual texture: subtle patterns, layered shadows, glassmorphism, noise via repeating-radial-gradient
- For marketing: fewer words, bigger type, more visual drama
- For UI: proper spacing, clear labels, realistic placeholder content

ABSOLUTELY NO MOTION:
- NEVER use CSS animations, transitions, @keyframes, or any motion whatsoever
- NEVER use :hover, :focus, or any interactive pseudo-classes that change appearance
- NEVER use transform animations, opacity transitions, or any dynamic effects
- All designs must be 100% static — this is a static design tool, not a web app
- If you include ANY animation or transition, the design will be rejected

IMAGE RULES:
- NEVER use <img> tags or external image URLs — they will not load
- Use CSS-only visuals: gradients, box-shadows, border-radius shapes, pseudo-elements
- For image placeholders: use a colored div with dimensions and a subtle icon or text label
- background-image with url() is NOT allowed — use CSS gradients only

OUTPUT RULES:
- First line: <!--size:WIDTHxHEIGHT-->
- Then HTML only — no explanation, no markdown, no code fences
- ALL CSS in a <style> tag at the top
- Self-contained — no external dependencies whatsoever
- Use system font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Root element width must match the size hint
- IMPORTANT: Keep CSS concise. No animations, no transitions, no keyframes.
- CRITICAL: Generate exactly ONE design per response. Never include multiple designs, multiple ad variations, or multiple versions in one HTML file. The system handles variations externally — you only produce a single, complete design each time.`;
}
