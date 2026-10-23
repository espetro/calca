// The Tailwind v4 browser runtime, copied next to this file at dev/build time
// by the `calca-copy-frame-runtime` Vite plugin (source:
// @calca/format-html-tailwind package assets). Inlined so downloaded files and
// blob:-document renders work with zero network access.
import tailwindJs from "./tailwindcss.runtime.js?raw";

/** Skeleton (Fast mode) frames ship their own `<style>` block and no Tailwind utilities. */
export const needsTailwind = (html: string): boolean => !html.includes("<style");

const RESET_CSS = `
  html { overflow: hidden; }
  html, body { margin: 0; padding: 0; height: auto !important; min-height: 0 !important; max-height: none !important; }
  body { width: WIDTHpx; margin: 0 auto; background: white; overflow: hidden; }
  img, video, svg { max-width: 100%; height: auto; }
  [style*="100vh"], [style*="min-height: 100vh"], [style*="height: 100vh"] { height: auto !important; min-height: 0 !important; }
`;

/**
 * Wraps a frame's HTML into a self-contained document that renders the same
 * way the canvas does. The frame HTML is placed DIRECTLY inside `<body>` — a
 * nested `<body>`/`html` tag in the payload then merges its attributes (e.g.
 * `class="bg-slate-950"`) onto the real body, exactly like the canvas srcdoc.
 * Wrapping it in a div instead drops those attributes and loses the theme.
 *
 * The Tailwind runtime is inlined so downloaded files and blob:-document
 * renders work with zero network access.
 */
export const buildStandaloneHtml = (html: string, width: number, title = "Calca design"): string =>
  `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, "&lt;")}</title>
${needsTailwind(html) ? `<script>\n${tailwindJs}\n</script>` : ""}
<style>${RESET_CSS.replace("WIDTH", String(width))}</style>
</head><body>${html}</body></html>`;

/**
 * Builds an SVG `foreignObject` from the RENDERED document: takes the compiled
 * `<style>` elements (incl. Tailwind's generated utilities and skeleton styles)
 * plus the body's class/style — the only way to preserve Tailwind output, since
 * the CDN runtime can't execute inside an image context.
 */
export const buildSvgFromDocument = (doc: Document, width: number, height: number): string => {
  const styles = [...doc.querySelectorAll("style")].map((s) => s.outerHTML).join("\n");
  const computed = doc.defaultView?.getComputedStyle(doc.body);
  const inner = [...doc.body.childNodes]
    .map((n) => new XMLSerializer().serializeToString(n))
    .join("\n");
  const bodyAttrs = ` class="${doc.body.className}" style="background:${computed?.backgroundColor ?? "white"};color:${computed?.color ?? "black"};width:${width}px;margin:0;"`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml"${bodyAttrs}>${styles}${inner}</div>
  </foreignObject>
</svg>`;
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const slugify = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "design";
