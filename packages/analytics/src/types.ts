export interface BaseEventProperties {
  timestamp?: string;
}

export interface AppSessionStartEvent extends BaseEventProperties {
  previousSessionDurationMs?: number;
}

export interface AppSessionEndEvent extends BaseEventProperties {
  sessionDurationMs: number;
  designsCreated: number;
}

export interface AppWindowResizeEvent extends BaseEventProperties {
  width: number;
  height: number;
}

export interface CanvasExportCompleteEvent extends BaseEventProperties {
  format: "svg" | "png" | "jpg" | "tailwind" | "react";
  frameCount: number;
  durationMs: number;
}

export interface CanvasCommentAddedEvent extends BaseEventProperties {
  isReply: boolean;
  totalComments: number;
}

export interface AIGenerationStartEvent extends BaseEventProperties {
  wordCount: number;
  model: string;
  conceptCount: number;
  preset: "ui-ux" | "marketing" | "brand";
}

export interface AIGenerationCompleteEvent extends BaseEventProperties {
  wordCount: number;
  model: string;
  conceptCount: number;
  durationMs: number;
  preset: "ui-ux" | "marketing" | "brand";
}

export interface AIGenerationFailedEvent extends BaseEventProperties {
  errorType: "auth" | "rate_limit" | "timeout" | "provider_error" | "validation" | "unknown";
  model: string;
  errorMessage: string;
}

export interface AIModelChangedEvent extends BaseEventProperties {
  previousModel: string;
  newModel: string;
}

export interface AIPipelineStageStartEvent extends BaseEventProperties {
  stage: "queued" | "layout" | "images" | "compositing" | "review" | "refining" | "done" | "error";
  conceptId: string;
}

export interface AIPipelineStageCompleteEvent extends BaseEventProperties {
  stage: "queued" | "layout" | "images" | "compositing" | "review" | "refining" | "done" | "error";
  conceptId: string;
  durationMs: number;
}

export interface SettingsProviderChangedEvent extends BaseEventProperties {
  previousProvider: string;
  newProvider: string;
}

export interface SettingsModelChangedEvent extends BaseEventProperties {
  previousModel: string;
  newModel: string;
}

export interface SettingsThemeChangedEvent extends BaseEventProperties {
  previousTheme: string;
  newTheme: string;
}

export interface FeedbackSubmittedEvent extends BaseEventProperties {
  type: "bug" | "feature" | "feedback";
}

export interface FeedbackRateLimitedEvent extends BaseEventProperties {
  window: string;
}

export type AnalyticsEventProperties =
  | AppSessionStartEvent
  | AppSessionEndEvent
  | AppWindowResizeEvent
  | CanvasExportCompleteEvent
  | CanvasCommentAddedEvent
  | AIGenerationStartEvent
  | AIGenerationCompleteEvent
  | AIGenerationFailedEvent
  | AIModelChangedEvent
  | AIPipelineStageStartEvent
  | AIPipelineStageCompleteEvent
  | SettingsProviderChangedEvent
  | SettingsModelChangedEvent
  | SettingsThemeChangedEvent
  | FeedbackSubmittedEvent
  | FeedbackRateLimitedEvent;
