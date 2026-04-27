import { z } from "zod";

const htmlTagPattern = /<(?:!DOCTYPE|html|head|style|div|section|main|body|meta|link)[>\s]/i;

export const LayoutSchema = z.string().transform((raw) => {
  let cleaned = raw.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  }
  const fenceMatch = cleaned.match(/```(?:html)?\n?([\s\S]*?)\n?```/);
  if (fenceMatch) cleaned = fenceMatch[1];
  cleaned = cleaned.trim();

  const sizeMatch = cleaned.match(/<!--size:(\d+)x(\d+)-->/);
  let width: number | undefined;
  let height: number | undefined;
  if (sizeMatch) {
    width = parseInt(sizeMatch[1], 10);
    height = parseInt(sizeMatch[2], 10);
    cleaned = cleaned.replace(/<!--size:\d+x\d+-->\n?/, "").trim();
  }

  let comment: string | undefined;
  const commentMatch = cleaned.match(/<!--otto:(.*?)-->/);
  if (commentMatch) {
    comment = commentMatch[1].trim();
    cleaned = cleaned.replace(/<!--otto:.*?-->\n?/, "").trim();
  }

  const htmlStart = cleaned.match(
    /^[\s\S]*?(<(?:!DOCTYPE|html|head|style|div|section|main|body|meta|link)[>\s])/i,
  );
  if (htmlStart && htmlStart.index !== undefined && htmlStart.index > 0) {
    cleaned = cleaned.substring(htmlStart.index);
  }
  const lastTagMatch = cleaned.match(/([\s\S]*<\/(?:html|div|section|main|body)>)/i);
  if (lastTagMatch) cleaned = lastTagMatch[1];

  return { html: cleaned.trim(), width, height, comment };
});

export const LayoutParsedSchema = z.object({
  html: z
    .string()
    .min(1)
    .refine((html) => htmlTagPattern.test(html), {
      message: "String must contain a valid HTML tag",
    }),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  comment: z.string().optional(),
});

export const validateLayout = (raw: string) => {
  const parsed = LayoutSchema.parse(raw);
  return LayoutParsedSchema.parse(parsed);
};

export type LayoutOutput = z.infer<typeof LayoutParsedSchema>;
