export type FeedbackType = "bug" | "feature" | "feedback";

export interface FeedbackFormData {
  type: FeedbackType;
  title: string;
  description: string;
  email: string;
  includeSystemInfo: boolean;
}

export interface FeedbackSubmitResult {
  commentUrl: string;
}

export type FeedbackSubmitStatus = "idle" | "submitting" | "success" | "error" | "rate_limited";
