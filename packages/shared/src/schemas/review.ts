import { z } from "zod";

const htmlTagPattern = /<(?:!DOCTYPE|html|head|style|div|section|main|body|meta|link)[>\s]/i;

export const ReviewSchema = z.string().transform((raw) => {
  let cleaned = raw.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
  }
  const fenceMatch = cleaned.match(/```(?:html)?\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1];
  }
  cleaned = cleaned.trim();

  const sizeMatch = cleaned.match(/<!--size:(\d+)x(\d+)-->/);
  let width: number | undefined;
  let height: number | undefined;
  if (sizeMatch) {
    width = Number.parseInt(sizeMatch[1], 10);
    height = Number.parseInt(sizeMatch[2], 10);
    cleaned = cleaned.replace(/<!--size:\d+x\d+-->\n?/, "").trim();
  }

  const htmlStart = cleaned.match(
    /^[\s\S]*?(<(?:!DOCTYPE|html|head|style|div|section|main|body|meta|link)[>\s])/i,
  );
  if (htmlStart && htmlStart.index !== undefined && htmlStart.index > 0) {
    cleaned = cleaned.substring(htmlStart.index);
  }
  const lastTagMatch = cleaned.match(/([\s\S]*<\/(?:html|div|section|main|body)>)/i);
  if (lastTagMatch) {
    cleaned = lastTagMatch[1];
  }

  return { height, html: cleaned.trim(), width };
});

export const ReviewParsedSchema = z.object({
  height: z.number().positive().optional(),
  html: z
    .string()
    .min(1)
    .refine((html) => htmlTagPattern.test(html), {
      message: "Review output must contain a valid HTML tag",
    }),
  width: z.number().positive().optional(),
});

export const validateReview = (raw: string) => {
  const parsed = ReviewSchema.parse(raw);
  return ReviewParsedSchema.parse(parsed);
};

export type ReviewOutput = z.infer<typeof ReviewParsedSchema>;
