const TAILWIND_CDN = "https://cdn.tailwindcss.com";

const getTailwindSrc = (): string => {
  const desktop = (window as unknown as { __CALCA_DESKTOP__?: boolean }).__CALCA_DESKTOP__;
  return desktop ? `${window.location.origin}/tailwindcss.js` : TAILWIND_CDN;
};

/** Skeleton (Fast mode) frames ship their own `<style>` block and no Tailwind utilities. */
export const needsTailwind = (html: string): boolean => !html.includes("<style");

export const EXPORT_ROOT_ID = "calca-export-root";

/**
 * Wraps a frame's HTML into a self-contained document that renders the same
 * way the canvas does: Tailwind runtime when the frame needs it, viewport-height
 * sections neutralized (otherwise they stretch to the render surface), and a
 * fixed-width root to measure.
 */
export const buildStandaloneHtml = (html: string, width: number, title = "Calca design"): string =>
  `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, "&lt;")}</title>
${needsTailwind(html) ? `<script src="${getTailwindSrc()}"></script>` : ""}
<style>
  html, body { margin: 0; padding: 0; background: white; }
  #${EXPORT_ROOT_ID} { width: ${width}px; margin: 0 auto; overflow: hidden; }
  [style*="100vh"] { height: auto !important; min-height: 0 !important; }
</style>
</head><body><div id="${EXPORT_ROOT_ID}">${html}</div></body></html>`;

/** Wraps HTML in an SVG `foreignObject` sized to the frame. */
export const buildSvg = (html: string, width: number, height: number): string => {
  const xhtml = html.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-f]+;)/gi, "&amp;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px">${xhtml}</div>
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
