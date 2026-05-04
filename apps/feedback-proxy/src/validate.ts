import { FeedbackRequest } from "./types.js";

/**
 * Validates a raw request body into a FeedbackRequest.
 *
 * @param body - The raw unknown request body
 * @returns Either a successful validation result with typed data, or an error string
 */
export function validateFeedback(
  body: unknown,
): { ok: true; data: FeedbackRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!["bug", "feature", "feedback"].includes(b.type as string)) {
    return { ok: false, error: "type must be one of: bug, feature, feedback" };
  }

  if (typeof b.title !== "string" || b.title.trim().length === 0) {
    return { ok: false, error: "title is required" };
  }
  if (b.title.length > 200) {
    return { ok: false, error: "title must be at most 200 characters" };
  }

  if (typeof b.description !== "string" || b.description.trim().length === 0) {
    return { ok: false, error: "description is required" };
  }
  if (b.description.length > 5000) {
    return { ok: false, error: "description must be at most 5000 characters" };
  }

  if (b.email !== undefined && (typeof b.email !== "string" || b.email.length > 254)) {
    return { ok: false, error: "email must be a valid string (max 254 chars)" };
  }

  if (
    b.metadata !== undefined &&
    (typeof b.metadata !== "object" || b.metadata === null || Array.isArray(b.metadata))
  ) {
    return { ok: false, error: "metadata must be a plain object" };
  }

  return {
    ok: true,
    data: {
      type: b.type as FeedbackRequest["type"],
      title: b.title.trim(),
      description: b.description.trim(),
      email: b.email?.trim(),
      metadata: b.metadata as object | undefined,
    },
  };
}
