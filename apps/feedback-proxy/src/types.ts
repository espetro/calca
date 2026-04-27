export interface FeedbackRequest {
  type: "bug" | "feature" | "feedback";
  title: string;
  description: string;
  email?: string;
  metadata?: object;
}

export interface FeedbackResponse {
  issueUrl: string;
  issueNumber: number;
}
