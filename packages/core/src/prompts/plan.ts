export function buildPlanPrompt(prompt: string): string {
  return `You are a creative director planning VISUAL STYLE variations for a design. Given this design request, decide how many distinct visual directions to create (between 2 and 6) and describe each one.

Design request: "${prompt}"

CRITICAL: Each concept must be a VISUAL STYLE DIRECTION (colors, typography, layout style, mood) — NOT a different product, brand, or content idea. Every concept must be a different visual interpretation of the SAME design request above.

WRONG (changing the content/product):
- "SaaS productivity dashboard" when the request was about glasses
- "E-commerce fashion store" when the request was about a restaurant

RIGHT (different visual takes on the same content):
- "Dark premium feel — black backgrounds, gold accents, editorial typography"
- "Bright and playful — vibrant yellows, rounded shapes, friendly layout"
- "Minimal and clean — lots of whitespace, monochrome palette, Swiss typography"

Consider:
- Simple components (buttons, inputs) → 2-3 concepts
- Cards, modals, forms → 3-4 concepts  
- Marketing assets (social cards, banners) → 4-5 concepts
- Full pages (landing, dashboard) → 2-3 concepts (they're complex)

Respond in EXACTLY this JSON format, nothing else:
{"count":N,"concepts":["visual style direction 1","visual style direction 2",...]}`;
}
