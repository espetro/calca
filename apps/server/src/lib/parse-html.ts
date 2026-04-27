export function parseHtmlWithSize(
  raw: string,
  options?: { extractComments?: boolean; trimHtml?: boolean },
): { html: string; width?: number; height?: number; comment?: string } {
  const { extractComments = false, trimHtml = true } = options ?? {};

  let cleaned = trimHtml ? raw.trim() : raw;

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  }
  const fenceMatch = cleaned.match(/```(?:html)?\n?([\s\S]*?)\n?```/);
  if (fenceMatch) cleaned = fenceMatch[1];
  if (trimHtml) cleaned = cleaned.trim();

  const sizeMatch = cleaned.match(/<!--size:(\d+)x(\d+)-->/);
  let width: number | undefined;
  let height: number | undefined;

  if (sizeMatch) {
    width = parseInt(sizeMatch[1], 10);
    height = parseInt(sizeMatch[2], 10);
    cleaned = cleaned.replace(/<!--size:\d+x\d+-->\n?/, "");
    if (trimHtml) cleaned = cleaned.trim();
  }

  let comment: string | undefined;
  if (extractComments) {
    const commentMatch = cleaned.match(/<!--otto:(.*?)-->/);
    if (commentMatch) {
      comment = commentMatch[1].trim();
      cleaned = cleaned.replace(/<!--otto:.*?-->\n?/, "");
      if (trimHtml) cleaned = cleaned.trim();
    }
  }

  const htmlStart = cleaned.match(
    /^[\s\S]*?(<(?:!DOCTYPE|html|head|style|div|section|main|body|meta|link)[>\s])/i,
  );
  if (htmlStart && htmlStart.index !== undefined && htmlStart.index > 0) {
    cleaned = cleaned.substring(htmlStart.index);
  }

  const lastTagMatch = cleaned.match(/([\s\S]*<\/(?:html|div|section|main|body)>)/i);
  if (lastTagMatch) cleaned = lastTagMatch[1];

  return { html: trimHtml ? cleaned.trim() : cleaned, width, height, comment };
}
