import { atom } from "jotai";

import type { FeedbackFormData, FeedbackSubmitStatus, FeedbackType } from "./types";

export const feedbackModalOpenAtom = atom(false);

export const defaultFeedbackFormData: FeedbackFormData = {
  type: "bug" as FeedbackType,
  title: "",
  description: "",
  email: "",
  includeSystemInfo: true,
};

export const feedbackFormDataAtom = atom<FeedbackFormData>(defaultFeedbackFormData);

export const feedbackSubmitStatusAtom = atom<FeedbackSubmitStatus>("idle");

export const feedbackSubmitErrorAtom = atom<string | null>(null);

export const feedbackSubmitResultAtom = atom<{ issueUrl: string; issueNumber: number } | null>(
  null,
);
