/**
 * @app/analytics — Event instrumentation helpers
 *
 * Provides typed wrapper functions for common analytics patterns.
 * These functions only capture METADATA — never prompt content or generated code.
 *
 * Usage:
 *   import { trackGenerationStart, trackGenerationComplete } from "@app/analytics";
 *
 *   trackGenerationStart({ model: "claude-sonnet-4-5", wordCount: 12, conceptCount: 4 });
 *   trackGenerationComplete({ model: "claude-sonnet-4-5", wordCount: 12, conceptCount: 4, durationMs: 5000 });
 */

import {
  AI_GENERATION_START,
  AI_GENERATION_COMPLETE,
  AI_GENERATION_FAILED,
  AI_MODEL_CHANGED,
  AI_PIPELINE_STAGE_START,
  AI_PIPELINE_STAGE_COMPLETE,
  APP_SESSION_START,
  APP_SESSION_END,
  CANVAS_EXPORT_COMPLETE,
  CANVAS_COMMENT_ADDED,
  SETTINGS_PROVIDER_CHANGED,
  SETTINGS_MODEL_CHANGED,
  SETTINGS_THEME_CHANGED,
} from "./events";
import { captureEvent } from "./posthog-client";
import type {
  AIGenerationStartEvent,
  AIGenerationCompleteEvent,
  AIGenerationFailedEvent,
  AIModelChangedEvent,
  AIPipelineStageStartEvent,
  AIPipelineStageCompleteEvent,
  AppSessionStartEvent,
  AppSessionEndEvent,
  CanvasExportCompleteEvent,
  CanvasCommentAddedEvent,
  SettingsProviderChangedEvent,
  SettingsModelChangedEvent,
  SettingsThemeChangedEvent,
} from "./types";

// ── App Lifecycle ─────────────────────────────────────────────────────────────

export function trackAppSessionStart(previousSessionDurationMs?: number): void {
  const event: AppSessionStartEvent = {
    previousSessionDurationMs,
  };
  captureEvent(APP_SESSION_START, event);
}

export function trackAppSessionEnd(sessionDurationMs: number, designsCreated: number): void {
  const event: AppSessionEndEvent = {
    sessionDurationMs,
    designsCreated,
  };
  captureEvent(APP_SESSION_END, event);
}

// ── AI Generation ────────────────────────────────────────────────────────────

/**
 * Track when user submits a prompt for generation.
 * @param model - Model ID (e.g. "claude-sonnet-4-5")
 * @param wordCount - Word count of the prompt (NOT the prompt text itself)
 * @param conceptCount - Number of variations to generate
 * @param preset - Design preset type
 */
export function trackGenerationStart(
  model: string,
  wordCount: number,
  conceptCount: number,
  preset: "ui-ux" | "marketing" | "brand" = "ui-ux",
): void {
  const event: AIGenerationStartEvent = {
    wordCount,
    model,
    conceptCount,
    preset,
  };
  captureEvent(AI_GENERATION_START, event);
}

/**
 * Track successful generation completion.
 */
export function trackGenerationComplete(
  model: string,
  wordCount: number,
  conceptCount: number,
  durationMs: number,
  preset: "ui-ux" | "marketing" | "brand" = "ui-ux",
): void {
  const event: AIGenerationCompleteEvent = {
    wordCount,
    model,
    conceptCount,
    durationMs,
    preset,
  };
  captureEvent(AI_GENERATION_COMPLETE, event);
}

/**
 * Track failed generation.
 * @param errorType - Generic error category (not the actual error message)
 */
export function trackGenerationFailed(
  errorType: "auth" | "rate_limit" | "timeout" | "provider_error" | "validation" | "unknown",
  model: string,
  errorMessage: string,
): void {
  const event: AIGenerationFailedEvent = {
    errorType,
    model,
    errorMessage,
  };
  captureEvent(AI_GENERATION_FAILED, event);
}

// ── AI Model Change ───────────────────────────────────────────────────────────

export function trackModelChanged(previousModel: string, newModel: string): void {
  const event: AIModelChangedEvent = {
    previousModel,
    newModel,
  };
  captureEvent(AI_MODEL_CHANGED, event);
}

// ── Pipeline Stages ───────────────────────────────────────────────────────────

export function trackPipelineStageStart(
  stage: "queued" | "layout" | "images" | "compositing" | "review" | "refining" | "done" | "error",
  conceptId: string,
): void {
  const event: AIPipelineStageStartEvent = {
    stage,
    conceptId,
  };
  captureEvent(AI_PIPELINE_STAGE_START, event);
}

export function trackPipelineStageComplete(
  stage: "queued" | "layout" | "images" | "compositing" | "review" | "refining" | "done" | "error",
  conceptId: string,
  durationMs: number,
): void {
  const event: AIPipelineStageCompleteEvent = {
    stage,
    conceptId,
    durationMs,
  };
  captureEvent(AI_PIPELINE_STAGE_COMPLETE, event);
}

// ── Canvas Events ────────────────────────────────────────────────────────────

export function trackExportComplete(
  format: "svg" | "png" | "jpg" | "tailwind" | "react",
  frameCount: number,
  durationMs: number,
): void {
  const event: CanvasExportCompleteEvent = {
    format,
    frameCount,
    durationMs,
  };
  captureEvent(CANVAS_EXPORT_COMPLETE, event);
}

export function trackCommentAdded(isReply: boolean, totalComments: number): void {
  const event: CanvasCommentAddedEvent = {
    isReply,
    totalComments,
  };
  captureEvent(CANVAS_COMMENT_ADDED, event);
}

// ── Settings Changes ─────────────────────────────────────────────────────────

export function trackProviderChanged(previousProvider: string, newProvider: string): void {
  const event: SettingsProviderChangedEvent = {
    previousProvider,
    newProvider,
  };
  captureEvent(SETTINGS_PROVIDER_CHANGED, event);
}

export function trackSettingsModelChanged(previousModel: string, newModel: string): void {
  const event: SettingsModelChangedEvent = {
    previousModel,
    newModel,
  };
  captureEvent(SETTINGS_MODEL_CHANGED, event);
}

export function trackThemeChanged(previousTheme: string, newTheme: string): void {
  const event: SettingsThemeChangedEvent = {
    previousTheme,
    newTheme,
  };
  captureEvent(SETTINGS_THEME_CHANGED, event);
}
