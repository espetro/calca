/**
 * @app/analytics — Analytics package barrel export
 *
 * Provides PostHog-based analytics with GDPR-compliant cookieless mode.
 * For use in Electrobun webview (no external CDN loading).
 *
 * Usage:
 *   import { initAnalytics, captureEvent, APP_SESSION_START } from "@app/analytics";
 *
 *   initAnalytics();
 *   captureEvent(APP_SESSION_START, { previousSessionDurationMs: 30000 });
 */

export {
  initAnalytics,
  captureEvent,
  optOut,
  optIn,
  isAnalyticsEnabled,
} from "./posthog-client";

export {
  APP_SESSION_START,
  APP_SESSION_END,
  APP_WINDOW_RESIZE,
  CANVAS_EXPORT_COMPLETE,
  CANVAS_COMMENT_ADDED,
  AI_GENERATION_START,
  AI_GENERATION_COMPLETE,
  AI_GENERATION_FAILED,
  AI_MODEL_CHANGED,
  AI_PIPELINE_STAGE_START,
  AI_PIPELINE_STAGE_COMPLETE,
  SETTINGS_PROVIDER_CHANGED,
  SETTINGS_MODEL_CHANGED,
  SETTINGS_THEME_CHANGED,
  FEEDBACK_SUBMITTED,
  FEEDBACK_RATE_LIMITED,
  type EventName,
  ALL_EVENTS,
} from "./events";

export type {
  AnalyticsEventProperties,
  BaseEventProperties,
  AppSessionStartEvent,
  AppSessionEndEvent,
  AppWindowResizeEvent,
  CanvasExportCompleteEvent,
  CanvasCommentAddedEvent,
  AIGenerationStartEvent,
  AIGenerationCompleteEvent,
  AIGenerationFailedEvent,
  AIModelChangedEvent,
  AIPipelineStageStartEvent,
  AIPipelineStageCompleteEvent,
  SettingsProviderChangedEvent,
  SettingsModelChangedEvent,
  SettingsThemeChangedEvent,
  FeedbackSubmittedEvent,
  FeedbackRateLimitedEvent,
} from "./types";

export {
  trackAppSessionStart,
  trackAppSessionEnd,
  trackGenerationStart,
  trackGenerationComplete,
  trackGenerationFailed,
  trackModelChanged,
  trackPipelineStageStart,
  trackPipelineStageComplete,
  trackExportComplete,
  trackCommentAdded,
  trackProviderChanged,
  trackSettingsModelChanged,
  trackThemeChanged,
} from "./instrument";
