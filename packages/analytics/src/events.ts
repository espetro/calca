export const APP_SESSION_START = "app:session_start";
export const APP_SESSION_END = "app:session_end";
export const APP_WINDOW_RESIZE = "app:window_resize";

export const CANVAS_EXPORT_COMPLETE = "canvas:export_complete";
export const CANVAS_COMMENT_ADDED = "canvas:comment_added";

export const AI_GENERATION_START = "ai:generation_start";
export const AI_GENERATION_COMPLETE = "ai:generation_complete";
export const AI_GENERATION_FAILED = "ai:generation_failed";
export const AI_MODEL_CHANGED = "ai:model_changed";
export const AI_PIPELINE_STAGE_START = "ai:pipeline_stage_start";
export const AI_PIPELINE_STAGE_COMPLETE = "ai:pipeline_stage_complete";

export const SETTINGS_PROVIDER_CHANGED = "settings:provider_changed";
export const SETTINGS_MODEL_CHANGED = "settings:model_changed";
export const SETTINGS_THEME_CHANGED = "settings:theme_changed";

export const FEEDBACK_SUBMITTED = "feedback:submitted";
export const FEEDBACK_RATE_LIMITED = "feedback:rate_limited";

export type EventName =
  | typeof APP_SESSION_START
  | typeof APP_SESSION_END
  | typeof APP_WINDOW_RESIZE
  | typeof CANVAS_EXPORT_COMPLETE
  | typeof CANVAS_COMMENT_ADDED
  | typeof AI_GENERATION_START
  | typeof AI_GENERATION_COMPLETE
  | typeof AI_GENERATION_FAILED
  | typeof AI_MODEL_CHANGED
  | typeof AI_PIPELINE_STAGE_START
  | typeof AI_PIPELINE_STAGE_COMPLETE
  | typeof SETTINGS_PROVIDER_CHANGED
  | typeof SETTINGS_MODEL_CHANGED
  | typeof SETTINGS_THEME_CHANGED
  | typeof FEEDBACK_SUBMITTED
  | typeof FEEDBACK_RATE_LIMITED;

export const ALL_EVENTS = [
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
] as const;
