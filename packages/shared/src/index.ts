export {
  LayoutSchema,
  LayoutParsedSchema,
  validateLayout,
  type LayoutOutput,
} from "./schemas/layout";

export {
  ReviewSchema,
  ReviewParsedSchema,
  validateReview,
  type ReviewOutput,
} from "./schemas/review";

export {
  CritiqueSchema,
  CritiqueParsedSchema,
  validateCritique,
  type CritiqueOutput,
} from "./schemas/critique";

export {
  SummarySchema,
  SummaryParsedSchema,
  validateSummary,
  type SummaryOutput,
} from "./schemas/summary";

export { stripReasoningBlocks } from "./strip-reasoning";

// Domain types live in the Apache-2.0 `@calca/shared` package; re-exported
// here so existing `@app/shared` imports keep working.
export * from "@calca/shared";
