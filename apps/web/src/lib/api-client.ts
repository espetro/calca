import type { AppRoutes } from "@app/server";
import { hc } from "hono/client";
import type { ClientResponse } from "hono/client";

export const apiClient = hc<AppRoutes>(import.meta.env.VITE_API_BASE_URL ?? "");
export type { ClientResponse };

const ERROR_BODY_MAX = 300;

// Best-effort detail from an error body: the JSON `error`/`message` field when
// it parses, else raw text — never more than ERROR_BODY_MAX chars.
const readErrorDetail = async (response: ClientResponse<unknown>): Promise<string> => {
  const stream = response.body;
  if (!stream) {
    return "";
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length <= ERROR_BODY_MAX) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      text += decoder.decode(value, { stream: true });
    }
  } catch {
    // Fall through — surface whatever was read
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }

  const bounded = text.trim().slice(0, ERROR_BODY_MAX);
  try {
    const parsed = JSON.parse(bounded) as { error?: unknown; message?: unknown };
    const field = parsed.error ?? parsed.message;
    if (typeof field === "string" && field) {
      return field;
    }
  } catch {
    // Not JSON — surface the raw text
  }
  return bounded;
};

/** "<fallback> (<status>)", plus the server's error detail when it has one. */
export const apiErrorMessage = async (
  response: ClientResponse<unknown>,
  fallback: string,
): Promise<string> => {
  const detail = await readErrorDetail(response);
  return `${fallback} (${response.status})${detail ? `: ${detail}` : ""}`;
};
