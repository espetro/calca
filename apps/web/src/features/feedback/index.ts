// Copyright (c) 2026 Joaquin Terrasa. All rights reserved.
// Licensed under the AGPL-3.0. See packages/shared/LICENSE for details.

export { FeedbackModal } from "./ui/feedback-modal";
export { BugIcon } from "./ui/bug-icon";
export { showFeedbackAtom } from "./state/feedback-atoms";
export {
  feedbackModalOpenAtom,
  feedbackFormDataAtom,
  feedbackSubmitStatusAtom,
  feedbackSubmitErrorAtom,
  feedbackSubmitResultAtom,
} from "./store";
export type {
  FeedbackType,
  FeedbackFormData,
  FeedbackSubmitResult,
  FeedbackSubmitStatus,
} from "./types";
