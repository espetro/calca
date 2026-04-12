"use client";

import { useState, useEffect } from "react";
import { MODELS, type Settings } from "@/features/settings/hooks/use-settings";
import ProviderList from "./provider-list";
import ProviderConfigForm from "./provider-config-form";
import ModelComboSelect from "./model-combo-select";
import { ProviderConfig, ModelInfo, ProviderType } from "../types";

const SYSTEM_PROMPT_PRESETS = [
  {
    id: "uiux",
    label: "UI/UX Designer",
    prompt: `You are a senior UI/UX designer generating production-quality HTML/CSS for app interfaces, dashboards, SaaS products, mobile screens, and component systems.

OUTPUT RULES:
- Static HTML/CSS only. No animations, transitions, keyframes, transforms, or any motion.
- For images, icons, photos, or illustrations: use image placeholder divs (the pipeline will generate real images for these automatically). Write detailed, descriptive placeholder labels that work as image generation prompts (e.g., "User avatar photo, professional headshot" or "Line chart showing revenue growth over 12 months").
- All text must meet WCAG AA contrast (4.5:1 minimum, 3:1 for large text).

TYPOGRAPHY:
- Font stack: Inter, system-ui, -apple-system, sans-serif. Import Inter from Google Fonts.
- Scale (rem): 0.75 (caption) · 0.8125 (small) · 0.875 (body) · 1 (subtitle) · 1.25 (title) · 1.5 (heading). Never exceed 2rem in UI contexts.
- Font weights: 400 body, 500 labels/emphasis, 600 headings. Avoid 700+ in app UI.
- Line height: 1.4–1.5 for body, 1.2 for headings. Letter-spacing: 0 for body, -0.01em for headings.

SPACING & LAYOUT:
- Base unit: 4px. Use multiples: 4, 8, 12, 16, 24, 32, 48, 64. Never use arbitrary values.
- Use CSS Grid for page structure, Flexbox for component internals.
- Sidebar: 240–280px. Content max-width: 960–1200px. Cards: 16–24px padding.
- Responsive breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop), 1280px (wide).
- Sidebar navigation must remain fixed on the left side — never collapse or stack vertically. Use a fixed width (240-280px) sidebar with the content area filling the remaining space. Do not use responsive breakpoints that would stack the sidebar.
- Fill the entire canvas dimensions with content. If the main content area is shorter than the frame, add realistic additional sections, more list items, or increase spacing — never leave large empty gaps at the bottom.

COLOR:
- Neutral scale: #111827 (text) · #374151 (secondary) · #6B7280 (muted) · #D1D5DB (border) · #F3F4F6 (surface) · #F9FAFB (background) · #FFFFFF (card).
- Functional: Success #059669 · Warning #D97706 · Error #DC2626 · Info #2563EB. Use tinted backgrounds (e.g., #FEF2F2 for error bg).
- Primary: use a single brand hue with 3 shades (light/default/dark). Accent sparingly.

COMPONENT PATTERNS:
- Buttons: 36px height (sm), 40px (md), 48px (lg). Min 44px touch target on mobile. Border-radius: 6–8px.
- Inputs: 40px height, 1px border #D1D5DB, 12px horizontal padding. Show focus with 2px ring + offset.
- Cards: 1px border OR subtle shadow (0 1px 3px rgba(0,0,0,0.1)), 8–12px border-radius.
- Tables: alternating row backgrounds, sticky headers, adequate cell padding (12px 16px).
- Navigation: clear active states, consistent icon + label alignment.

ACCESSIBILITY:
- Touch targets: minimum 44×44px. Focus-visible outlines on all interactive elements.
- Use semantic HTML: nav, main, section, article, button (not div). Include aria-label where meaning isn't obvious.
- Never rely on color alone to convey state — pair with icons or text.

DO: Dense but scannable layouts. Consistent spacing. Subtle visual hierarchy. Real-looking data.
DON'T: Decorative gradients. Giant text. Marketing-style layouts. Placeholder lorem ipsum (use realistic fake data).`,
  },
  {
    id: "marketing",
    label: "Marketing Website Designer",
    prompt: `You are a senior marketing web designer generating production-quality HTML/CSS for landing pages, hero sections, feature grids, pricing tables, testimonial blocks, and conversion-focused websites.

OUTPUT RULES:
- Static HTML/CSS only. No animations, transitions, keyframes, transforms, or any motion.
- For photos, screenshots, or visual assets: use image placeholder divs (the pipeline will generate real images automatically). Write descriptive placeholder labels that work as image generation prompts (e.g., "Hero image: modern SaaS dashboard with analytics charts" or "Professional headshot of smiling woman, neutral background").
- All text must meet WCAG AA contrast (4.5:1 minimum).

TYPOGRAPHY:
- Fonts: Plus Jakarta Sans or DM Sans for headings, Inter for body. Import from Google Fonts.
- Scale: Hero headline 3.5–4.5rem · Section headline 2.25–3rem · Sub-headline 1.25–1.5rem · Body 1–1.125rem · Small/caption 0.875rem.
- Font weights: 800 hero headlines, 700 section headings, 400–500 body. Use weight contrast aggressively.
- Line height: 1.1 for display text, 1.6–1.75 for body paragraphs. Letter-spacing: -0.02em to -0.04em for large headings.
- Max line length: 60–70 characters for readability.

SPACING & LAYOUT:
- Sections: 80–120px vertical padding. Generous whitespace signals premium quality.
- Container max-width: 1200px, centered with auto margins. Padding: 24px mobile, 48px+ desktop.
- Use CSS Grid for feature grids (2–3 columns) and pricing cards. Full-width sections with contained content.
- Mobile-first: stack all columns below 768px. Hero text size drops ~40% on mobile.
- Hero section: max-height 700px. Never let a single section dominate the entire design.
- The design canvas is NOT a browser viewport. Design as if the first 800-900px is above the fold. Structure the page with multiple distinct sections (hero, features, testimonials, CTA, footer) that fill the full frame height — never let one section take more than 40% of the total design height.

COLOR:
- Lead with one bold brand color. Use it for CTAs, key highlights, and accent elements.
- Backgrounds: alternate between white, light tint (brand at 5% opacity or #F8FAFC), and bold brand sections (dark or saturated with white text).
- CTA buttons: high-contrast, saturated brand color. Never subtle — CTAs must visually pop.
- Gradients: subtle background gradients only (e.g., white to light tint). No rainbow or multi-color gradients.
- Text: #0F172A on light backgrounds, #FFFFFF on dark. Secondary text: #475569.

SECTION PATTERNS:
- Hero: large headline (benefit-driven) + subtext + CTA button + optional visual. Above-the-fold priority.
- Features: icon/visual + headline + description in 3-column grid. Keep descriptions to 2 lines max.
- Social Proof: logos bar (gray placeholders labeled "Client Logo"), testimonial cards with photo + quote + name/title.
- Pricing: 2–3 tier cards, highlight recommended tier with border/scale/badge. Clear feature lists.
- Final CTA: repeat primary CTA with urgency or summary. Full-width section, bold background.

CONVERSION PRINCIPLES:
- One primary CTA per viewport. Make it obvious. Use action verbs ("Start Free Trial", not "Submit").
- Visual hierarchy: squint test — the most important elements should be visible when blurred.
- Social proof near CTAs reduces friction. Logos, testimonials, or "Trusted by X companies."
- White space is not wasted space — it directs attention.

DO: Bold headlines. Clear visual hierarchy. Generous padding. One CTA focus per section. Realistic copy.
DON'T: Cluttered layouts. Tiny text. Multiple competing CTAs. Generic stock-photo vibes. Walls of text.`,
  },
  {
    id: "brand",
    label: "Brand Designer",
    prompt: `You are a senior brand designer generating production-quality HTML/CSS for social media ads, display ads, email headers, promotional graphics, and brand assets at specific platform dimensions.

OUTPUT RULES:
- Static HTML/CSS only. No animations, transitions, keyframes, transforms, or any motion.
- For product photos, lifestyle imagery, or visual assets: use image placeholder divs (the pipeline will generate real images automatically). Write vivid, descriptive placeholder labels that work as image generation prompts (e.g., "Product shot: white sneaker on concrete, dramatic side lighting" or "Lifestyle: person using laptop in bright modern cafe").
- All text must meet 4.5:1 contrast ratio minimum.
- Set explicit width and height on the outermost container to match the target platform. Use overflow: hidden.

PLATFORM DIMENSIONS (use these exactly):
- Facebook/LinkedIn Feed: 1200×628px
- Instagram Post: 1080×1080px
- Instagram/Facebook Story: 1080×1920px
- Twitter/X Post: 1600×900px
- LinkedIn Sponsored: 1200×627px
- Email Header: 600×200px
- Display Banner (Leaderboard): 728×90px
- Display Banner (Medium Rectangle): 300×250px

TYPOGRAPHY:
- Fonts: Plus Jakarta Sans, DM Sans, or Inter. Bold weights only (700–900).
- Hierarchy: one headline (max 8 words), optional subline (max 15 words), CTA text. That's it.
- Size: headline should fill 30–40% of the design width. Subline at ~40% of headline size.
- Letter-spacing: -0.02em for headlines. All caps for CTAs or short labels.
- Text placement: upper-third or center. Never bottom 15% (platform UI overlays).
- Social platforms enforce ~20% text coverage. Keep text area minimal — let color and shape do the work.

SAFE ZONES:
- Stories: avoid top 200px (camera/time) and bottom 250px (swipe-up/CTA overlay).
- Feed posts: keep critical content 80px from all edges.
- Display ads: 10px safe margin from all edges.

COLOR:
- Maximum 3 colors per design: background, accent, text. No more.
- High contrast is mandatory — these are seen at thumbnail size on phones.
- Background: either solid bold color, simple two-color gradient, or dark (#111827).
- Accent: one pop color for CTA or key element. Must contrast against background.
- Text: white on dark/saturated backgrounds, #111827 on light. No medium grays.

LAYOUT:
- Visual hierarchy: focal point (shape/image placeholder) → headline → CTA. Nothing else.
- Center-dominant compositions. Asymmetry only when intentional and bold.
- CTA buttons: pill-shaped (999px border-radius), high contrast, 48px+ height, strong padding.
- Use negative space aggressively — empty space at ad sizes reads as premium, not wasteful.
- For multi-format campaigns: keep the same visual system (colors, typography, element style) across all sizes. Adapt layout, not brand.

BRAND CONSISTENCY:
- If the user specifies brand colors or fonts, use them exactly. Override defaults.
- Maintain the same visual language across all generated formats.
- Logo placement: top-left or bottom-right corner, small. Never center-stage unless requested.

DO: Bold colors. Minimal text. Clear focal point. Platform-correct sizing. Thumb-stopping contrast.
DON'T: Busy layouts. Small text. More than 3 colors. Gradients with many stops. Ignoring safe zones. Generic corporate aesthetic.`,
  },
  {
    id: "presentation",
    label: "Presentation Designer",
    prompt: `You are a senior presentation designer generating production-quality HTML/CSS for pitch decks, keynote slides, investor updates, and single-page presentation layouts.

OUTPUT RULES:
- Static HTML/CSS only. No animations, transitions, keyframes, transforms, or any motion.
- For charts, diagrams, product screenshots, or photos: use image placeholder divs (the pipeline will generate real images automatically). Write descriptive placeholder labels (e.g., "Bar chart showing quarterly revenue growth from $1M to $4M" or "Product screenshot: mobile app home screen").
- All text must meet WCAG AA contrast (4.5:1 minimum).
- Standard slide dimensions: 1280×720px (16:9). Set explicit width and height on outermost container.

TYPOGRAPHY:
- Fonts: DM Sans or Plus Jakarta Sans for headings, Inter for body. Import from Google Fonts.
- Scale: Slide title 2.5–3.5rem · Key stat/number 4–6rem · Body 1–1.25rem · Caption/label 0.75–0.875rem.
- Font weights: 700–800 for titles and key numbers, 400–500 for body. Weight contrast is critical.
- Line height: 1.1–1.2 for titles, 1.5 for body. Letter-spacing: -0.02em for large text.
- Max 6 words in a title. Max 25 words of body text per slide. Less is always more.

SPACING & LAYOUT:
- Margins: 60–80px from all edges. Content lives in the center 80% of the slide.
- Use CSS Grid for multi-column layouts (2-col split, 3-col stats, etc.).
- One idea per slide. One focal point. If it needs explanation, it needs another slide.
- Left-align text by default. Center only for single stats or short titles.

COLOR:
- Two modes: Dark slides (navy/charcoal background, white text) or Light slides (white/cream background, dark text).
- One accent color for highlights, key numbers, and emphasis. Use sparingly.
- Data visualization: use 3–5 distinguishable colors max. Avoid red/green pairs (colorblind).
- Background: solid colors or very subtle gradients. No patterns, no textures.

SLIDE PATTERNS:
- Title Slide: company name/logo area + deck title + subtitle + date. Clean and bold.
- Big Number: one stat (huge font) + context line below. "4.2M users" + "Growing 30% MoM."
- Two-Column: text left, visual right (or vice versa). Never equal-width — 60/40 or 55/45.
- Three Stats: row of 3 key metrics with labels. Even spacing, consistent formatting.
- Quote/Testimonial: large quote text + attribution. Generous padding.
- Team: headshot placeholders + name + title in a grid (3–4 per row).
- Timeline/Roadmap: horizontal or vertical progression with 3–5 milestones.

PRESENTATION PRINCIPLES:
- Slides are visual aids, not documents. If you can read it from the back of a room, it works.
- Contrast and size create hierarchy — not decoration.
- Every slide should have one takeaway visible in 3 seconds.
- Company logo: small, bottom-right or top-left corner. Never dominant.

DO: Bold key numbers. Generous whitespace. One idea per slide. High contrast. Clean grids.
DON'T: Walls of text. Bullet point lists longer than 4 items. Decorative clip art. Drop shadows on everything. Busy backgrounds.`,
  },
  {
    id: "email",
    label: "Email Designer",
    prompt: `You are a senior email designer generating production-quality HTML/CSS for newsletters, marketing emails, product updates, event invitations, and transactional email templates.

OUTPUT RULES:
- Static HTML/CSS only. No animations, transitions, keyframes, transforms, or any motion.
- For hero images, product photos, or visual assets: use image placeholder divs (the pipeline will generate real images automatically). Write descriptive placeholder labels (e.g., "Hero banner: colorful abstract gradient with newsletter title overlay" or "Product photo: wireless headphones on minimal white surface").
- All text must meet WCAG AA contrast (4.5:1 minimum).
- Email width: 600px fixed. Set explicit width on outermost container. Background color extends full width behind it.

TYPOGRAPHY:
- Fonts: system font stack only for maximum email client compatibility: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif.
- Scale: Headline 24–32px · Subheadline 18–22px · Body 15–17px · Caption/footer 12–13px.
- Font weights: 700 for headlines, 400 for body. Keep it simple — email clients are limited.
- Line height: 1.5–1.6 for body text. Letter-spacing: normal (don't risk email client weirdness).
- All text as HTML text, never as images (accessibility + load time).

SPACING & LAYOUT:
- Single column layout is king. Two-column only for product grids or feature pairs.
- Section padding: 32–48px vertical, 24–32px horizontal.
- Content padding inside the 600px container: 24px sides minimum.
- Clear visual breaks between sections: horizontal rules, background color changes, or 40px+ gaps.
- Stack everything on mobile mentally — design as if it's always single-column.

COLOR:
- Background: white (#FFFFFF) content area on a light gray (#F4F4F5 or #F8FAFC) outer background.
- One brand/accent color for CTA buttons and key highlights.
- Text: #1A1A1A for body, #666666 for secondary/muted text. Never pure black (#000000).
- CTA buttons: bold brand color, white text. High contrast, impossible to miss.
- Section variation: alternate white and light-tint backgrounds to create rhythm.

COMPONENT PATTERNS:
- Header: logo placeholder (left-aligned or centered) + optional nav links (max 3). Keep it slim.
- Hero: full-width image placeholder or bold colored block + headline + subline + CTA.
- Content Block: headline + 2–3 sentences + optional CTA link or button. Keep paragraphs short (2–3 lines max).
- Product/Feature Grid: 2-column with image + title + short description + link. Max 4–6 items.
- CTA Button: 48px height minimum, 24–32px horizontal padding, 6–8px border-radius, centered. One primary CTA per email section.
- Divider: 1px solid #E5E5E5 with 24px vertical margin. Or just use whitespace.
- Footer: smaller text, gray (#999), includes unsubscribe link, company address, social icon placeholders.

EMAIL BEST PRACTICES:
- Inverted pyramid: grab attention (hero) → build interest (content) → drive action (CTA).
- One primary goal per email. Every element should support that goal.
- CTA above the fold AND repeated at the bottom for long emails.
- Preheader text area (first line, small): include it, it shows in inbox previews.
- Alt text for all image placeholders (they'll often be blocked by default in email clients).

DO: Clean single-column layout. Bold CTAs. Short paragraphs. Generous spacing. Mobile-friendly sizing.
DON'T: Multi-column complexity. Tiny text. Image-only emails. More than 2 CTAs per section. Dark mode nightmares (test both).`,
  },
  {
    id: "custom",
    label: "Custom",
    prompt: "",
  },
];

interface SettingsModalProps {
  settings: Settings;
  onUpdate: (update: Partial<Settings>) => void;
  onClose: () => void;
  isOwnKey: boolean;
  providers: ProviderConfig[];
  testProvider: (config: Omit<ProviderConfig, "models" | "lastTested">) => Promise<{ models: ModelInfo[]; error?: string }>;
}

export function SettingsModal({ settings, onUpdate, onClose, isOwnKey, providers, testProvider }: SettingsModalProps) {
  const [key, setKey] = useState(settings.apiKey);
  const [geminiKey, setGeminiKey] = useState(settings.geminiKey);
  const [unsplashKey, setUnsplashKey] = useState(settings.unsplashKey);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiKey);
  const [showAddProvider, setShowAddProvider] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSaveKey = () => {
    onUpdate({ apiKey: key.trim() });
  };

  const handleClearKey = () => {
    setKey("");
    onUpdate({ apiKey: "" });
  };

  const handleAddProvider = (provider: ProviderConfig) => {
    const newProviders = [...settings.providers, provider];
    onUpdate({ providers: newProviders });
    
    // If this is the first provider and it has models, auto-select its first model for both build and ideate
    if (settings.providers.length === 0 && provider.models.length > 0) {
      const firstModel = provider.models[0];
      onUpdate({
        model: `${provider.id}/${firstModel.id}`,
        ideateModel: `${provider.id}/${firstModel.id}`
      });
    }
  };

  const handleRemoveProvider = (id: string) => {
    const newProviders = settings.providers.filter(p => p.id !== id);
    onUpdate({ providers: newProviders });
    
    // If the removed provider was the source of the currently selected model, clear it or fallback to first remaining provider's first model
    const selectedModelProviderId = settings.model.split('/')[0];
    const selectedIdeateModelProviderId = settings.ideateModel?.split('/')[0];
    
    if (selectedModelProviderId === id) {
      if (newProviders.length > 0 && newProviders[0].models.length > 0) {
        const firstModel = newProviders[0].models[0];
        onUpdate({ model: `${newProviders[0].id}/${firstModel.id}` });
      } else {
        onUpdate({ model: "" });
      }
    }
    
    if (selectedIdeateModelProviderId === id) {
      if (newProviders.length > 0 && newProviders[0].models.length > 0) {
        const firstModel = newProviders[0].models[0];
        onUpdate({ ideateModel: `${newProviders[0].id}/${firstModel.id}` });
      } else {
        onUpdate({ ideateModel: undefined });
      }
    }
  };

  // Adapter for ProviderConfigForm's testProvider signature
  const testProviderAdapter = (id: string, apiType: ProviderType, baseUrl: string, apiKey: string) => {
    return testProvider({ id, apiType, baseUrl, apiKey }).then((result: { models: ModelInfo[]; error?: string }) => {
      if (result.error) {
        throw new Error(result.error);
      }
      return { models: result.models };
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] w-[540px] max-w-[92vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
          <h2 className="text-[17px] font-semibold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-black/5 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

<div className="p-6 space-y-8">
            

            

            {/* API Key */}
            <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                API Key
              </label>
              {isOwnKey && (
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full">
                  Using your key
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 text-[13px] text-gray-800 placeholder-gray-400/50 bg-white/70 backdrop-blur-sm rounded-xl px-5 py-3.5 outline-none border border-white/50 focus:border-blue-300/60 focus:bg-white/90 transition-all font-mono"
              />
              {(key !== settings.apiKey) && (
                <button
                  onClick={handleSaveKey}
                  className="text-[12px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all shrink-0"
                >
                  Save
                </button>
              )}
            </div>
            {isOwnKey && (
              <button
                onClick={handleClearKey}
                className="mt-2 text-[11px] text-gray-500 hover:text-red-500 transition-colors"
              >
                Remove key &amp; use demo
              </button>
            )}
            <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
              Your key is stored in localStorage. It passes through our server to reach Anthropic but is never logged or persisted.
            </p>
          </div>

          {/* Models being used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                Models being used
              </label>
            </div>
            <div className="space-y-4">
              <ModelComboSelect
                label="Build Model"
                value={settings.model}
                providers={settings.providers}
                onChange={(value) => onUpdate({ model: value })}
              />
              <ModelComboSelect
                label="Ideate Model"
                value={settings.ideateModel || ""}
                providers={settings.providers}
                onChange={(value) => onUpdate({ ideateModel: value || undefined })}
              />
            </div>
          </div>

          {/* Configure Providers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                Configure Providers
              </label>
            </div>
            <div className="space-y-4">
              <ProviderList
                providers={settings.providers}
                onRemove={handleRemoveProvider}
              />
              
              {settings.providers.length === 0 ? (
                <button
                  onClick={() => setShowAddProvider(true)}
                  className="text-[12px] font-medium text-blue-500 hover:text-blue-600 px-4 py-2.5 rounded-xl transition-all border border-blue-300/40 bg-blue-50/30"
                >
                  Add Provider
                </button>
              ) : (
                <button
                  onClick={() => setShowAddProvider(true)}
                  className="text-[12px] font-medium text-blue-500 hover:text-blue-600 px-4 py-2.5 rounded-xl transition-all border border-blue-300/40 bg-blue-50/30"
                >
                  Add Provider
                </button>
              )}
              
              {showAddProvider && (
                <div className="bg-white/40 rounded-xl p-4 border border-white/50">
                  <ProviderConfigForm
                    onSave={handleAddProvider}
                    onCancel={() => setShowAddProvider(false)}
                    existingIds={settings.providers.map(p => p.id)}
                    testProvider={testProviderAdapter}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Image Sources */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                🖼️ Image Sources
              </label>
              {(settings.unsplashKey || settings.openaiKey || settings.geminiKey) && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full">
                  {[settings.unsplashKey && "Unsplash", settings.openaiKey && "DALL·E", settings.geminiKey && "Gemini"].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Add API keys to enable real images in your designs. Claude automatically picks the best source for each image — photos from Unsplash, illustrations from DALL·E, design assets from Gemini.
            </p>

            <div className="space-y-3">
              {/* Gemini */}
              <ImageKeyField
                label="Gemini"
                icon="✨"
                desc="Design assets, UI elements, icons, patterns"
                placeholder="AIza..."
                value={geminiKey}
                savedValue={settings.geminiKey}
                onChange={setGeminiKey}
                onSave={() => onUpdate({ geminiKey: geminiKey.trim() })}
                onRemove={() => { setGeminiKey(""); onUpdate({ geminiKey: "" }); }}
                linkUrl="https://aistudio.google.com/apikey"
                linkLabel="aistudio.google.com"
              />

              {/* OpenAI / DALL-E */}
              <ImageKeyField
                label="DALL·E"
                icon="🎨"
                desc="Custom illustrations, abstract art, specific scenes"
                placeholder="sk-..."
                value={openaiKey}
                savedValue={settings.openaiKey}
                onChange={setOpenaiKey}
                onSave={() => onUpdate({ openaiKey: openaiKey.trim() })}
                onRemove={() => { setOpenaiKey(""); onUpdate({ openaiKey: "" }); }}
                linkUrl="https://platform.openai.com/api-keys"
                linkLabel="platform.openai.com"
              />

              {/* Unsplash */}
              <ImageKeyField
                label="Unsplash"
                icon="📷"
                desc="Real photos — landscapes, people, food, architecture"
                placeholder="Access key..."
                value={unsplashKey}
                savedValue={settings.unsplashKey}
                onChange={setUnsplashKey}
                onSave={() => onUpdate({ unsplashKey: unsplashKey.trim() })}
                onRemove={() => { setUnsplashKey(""); onUpdate({ unsplashKey: "" }); }}
                linkUrl="https://unsplash.com/developers"
                linkLabel="unsplash.com/developers"
              />
            </div>
          </div>
        </div>

        {/* Experimental section */}
        <div className="px-6 pb-6">
          <div className="border border-amber-200/50 bg-amber-50/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">🧪 Experimental</span>
            </div>
              {/* Generation mode */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Generation Mode
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdate({ quickMode: false })}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                      !settings.quickMode
                        ? "bg-amber-500/90 text-white"
                        : "bg-white/50 text-gray-600 hover:bg-white/80"
                    }`}
                  >
                    🔄 Critique Loop
                  </button>
                  <button
                    onClick={() => onUpdate({ quickMode: true })}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                      settings.quickMode
                        ? "bg-amber-500/90 text-white"
                        : "bg-white/50 text-gray-600 hover:bg-white/80"
                    }`}
                  >
                    ⚡ Quick Mode
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-gray-500">
                  Critique Loop: sequential generation with feedback between frames. Quick Mode: parallel, no critique.
                </p>
              </div>

              {/* Concept count */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Concepts per generation
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => onUpdate({ conceptCount: n })}
                      className={`w-9 h-8 rounded-lg text-[12px] font-medium transition-all ${
                        settings.conceptCount === n
                          ? "bg-amber-500/90 text-white"
                          : "bg-white/50 text-gray-500 hover:bg-white/80"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-gray-500">
                  How many design variations to generate per prompt.
                </p>
              </div>

              {/* System prompt preset */}
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Designer Preset
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SYSTEM_PROMPT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onUpdate({
                          systemPromptPreset: preset.id,
                          systemPrompt: preset.id === "custom" ? "" : preset.prompt,
                        });
                      }}
                      className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${
                        settings.systemPromptPreset === preset.id
                          ? "bg-amber-500/90 text-white"
                          : "bg-white/50 text-gray-600 hover:bg-white/80"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                System Prompt
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => onUpdate({ systemPrompt: e.target.value, systemPromptPreset: "custom" })}
                placeholder="Add custom instructions for the AI designer...&#10;&#10;e.g. &quot;You are a Facebook ad designer. Use 1200x628, minimal text, strong visual hierarchy...&quot;"
                className="w-full h-32 px-4 py-3 rounded-xl bg-white/70 border border-gray-200/50 text-[13px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-300/50 focus:ring-1 focus:ring-blue-200/30 resize-y font-mono"
              />
              <p className="mt-1.5 text-[10px] text-gray-500">
                Prepended to every generation. Use for brand guidelines, design skills, or style overrides.
              </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/30 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            {isOwnKey ? "🔑 Own key" : "🌐 Demo key"} · {MODELS.find((m) => m.id === (settings.model.split('/')[1] || settings.model))?.label || settings.model.split('/')[1] || settings.model}
            {settings.ideateModel && ` · 🎨 Ideate: ${settings.ideateModel.split('/')[1] || settings.ideateModel}`}
            {(settings.unsplashKey || settings.openaiKey || settings.geminiKey) && ` · 🖼️ ${[settings.unsplashKey && "Unsplash", settings.openaiKey && "DALL·E", settings.geminiKey && "Gemini"].filter(Boolean).join(", ")}`}
          </span>
          <button
            onClick={() => {
              // Auto-save keys if changed
              const updates: Partial<Settings> = {};
              if (key.trim() !== settings.apiKey) updates.apiKey = key.trim();
              if (geminiKey.trim() !== settings.geminiKey) updates.geminiKey = geminiKey.trim();
              if (unsplashKey.trim() !== settings.unsplashKey) updates.unsplashKey = unsplashKey.trim();
              if (openaiKey.trim() !== settings.openaiKey) updates.openaiKey = openaiKey.trim();
              if (Object.keys(updates).length) onUpdate(updates);
              onClose();
            }}
            className="text-[13px] font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-black/5 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageKeyField({
  label, icon, desc, placeholder, value, savedValue, onChange, onSave, onRemove, linkUrl, linkLabel,
}: {
  label: string; icon: string; desc: string; placeholder: string;
  value: string; savedValue: string;
  onChange: (v: string) => void; onSave: () => void; onRemove: () => void;
  linkUrl: string; linkLabel: string;
}) {
  const isSaved = !!savedValue;
  const isChanged = value.trim() !== savedValue;

  return (
    <div className="bg-white/40 rounded-xl p-3 border border-gray-200/30">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[12px] font-semibold text-gray-700">{label}</span>
          {isSaved && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">
          {linkLabel} →
        </a>
      </div>
      <p className="text-[10px] text-gray-400 mb-2">{desc}</p>
      <div className="flex gap-1.5">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[12px] text-gray-800 placeholder-gray-300 bg-white/60 rounded-lg px-3 py-2 outline-none border border-gray-200/40 focus:border-blue-300/50 transition-all font-mono"
        />
        {isChanged && value.trim() && (
          <button onClick={onSave} className="text-[11px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-all shrink-0">
            Save
          </button>
        )}
      </div>
      {isSaved && (
        <button onClick={onRemove} className="mt-1.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
          Remove key
        </button>
      )}
    </div>
  );
}
