/**
 * Converts HTML/CSS to an SVG wrapper for rendering
 */
export function htmlToSvg(html: string): string {
  const widthMatch = html.match(/width\s*:\s*(\d+)px/);
  const heightMatch = html.match(/height\s*:\s*(\d+)px/);
  const width = widthMatch ? parseInt(widthMatch[1]) : 800;
  const height = heightMatch ? parseInt(heightMatch[1]) : 600;

  const escaped = html.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml">
${escaped}
    </div>
  </foreignObject>
</svg>`;
}
