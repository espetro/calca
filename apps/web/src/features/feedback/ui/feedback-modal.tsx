import { useCallback, useEffect, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Bug, Lightbulb, MessageSquare, Send, X, RotateCcw, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { captureEvent, FEEDBACK_RATE_LIMITED, FEEDBACK_SUBMITTED } from "@app/analytics";
import type { FeedbackType } from "../types";
import {
  feedbackModalOpenAtom,
  feedbackFormDataAtom,
  feedbackSubmitStatusAtom,
  feedbackSubmitErrorAtom,
  feedbackSubmitResultAtom,
  defaultFeedbackFormData,
} from "../store";
import { submitFeedback } from "../api";
import { canSubmitFeedback, recordSubmission } from "../lib/rate-limiter";

const TAB_CONFIG: { id: FeedbackType; label: string; icon: React.ReactNode }[] = [
  { id: "bug", label: "Bug Report", icon: <Bug className="w-3.5 h-3.5" /> },
  { id: "feature", label: "Feature Request", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: "feedback", label: "General Feedback", icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

function getSystemInfoPreview(): string {
  return [
    `App Version: 0.3.0`,
    `OS: ${navigator.platform}`,
    `Screen: ${window.screen.width}x${window.screen.height}`,
    `URL: ${window.location.href}`,
  ].join("\n");
}

export function FeedbackModal() {
  const [open, setOpen] = useAtom(feedbackModalOpenAtom);
  const [formData, setFormData] = useAtom(feedbackFormDataAtom);
  const [status, setStatus] = useAtom(feedbackSubmitStatusAtom);
  const [error, setError] = useAtom(feedbackSubmitErrorAtom);
  const [result, setResult] = useAtom(feedbackSubmitResultAtom);

  const [validationErrors, setValidationErrors] = useState<{ title?: string; description?: string }>({});

  const reset = useCallback(() => {
    setFormData(defaultFeedbackFormData);
    setStatus("idle");
    setError(null);
    setResult(null);
    setValidationErrors({});
  }, [setFormData, setStatus, setError, setResult]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const validate = (): boolean => {
    const errors: { title?: string; description?: string } = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 200) {
      errors.title = "Title must be 200 characters or less";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 5000) {
      errors.description = "Description must be 5000 characters or less";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const rateLimitCheck = canSubmitFeedback();
    if (!rateLimitCheck.allowed) {
      setStatus("rate_limited");
      captureEvent(FEEDBACK_RATE_LIMITED, { window: "client" });
      return;
    }

    setStatus("submitting");
    setError(null);
    try {
      const res = await submitFeedback(formData);
      recordSubmission();
      captureEvent(FEEDBACK_SUBMITTED, { type: formData.type });
      setResult(res);
      setStatus("success");
    } catch (err) {
      if (err instanceof Error && err.name === "RateLimitedError") {
        recordSubmission();
        captureEvent(FEEDBACK_RATE_LIMITED, { window: "server" });
        setStatus("rate_limited");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setStatus("error");
      }
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setError(null);
  };

  const setType = (type: FeedbackType) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "title" || field === "description") {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isSubmitting = status === "submitting";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0" showCloseButton={true}>
        <DialogTitle className="sr-only">Send Feedback</DialogTitle>
        <DialogDescription className="sr-only">
          Report a bug, request a feature, or share general feedback.
        </DialogDescription>

        <div className="flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-lg font-semibold text-foreground">Send Feedback</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Help us improve Calca by sharing your thoughts.
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto">
            {status === "success" && result && (
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">Thank you!</p>
                  <p className="text-sm text-muted-foreground">
                    Your feedback has been submitted as issue #{result.issueNumber}.
                  </p>
                </div>
                <a
                  href={result.issueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  View on GitHub
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-xs text-muted-foreground">Powered by GitHub</p>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            )}

            {status === "rate_limited" && (
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">Slow down!</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ve submitted too many reports. Please try again later.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center text-center py-8 gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-6 h-6 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-medium text-foreground">Something went wrong</p>
                  <p className="text-sm text-muted-foreground">{error || "Failed to submit feedback"}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRetry}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Try Again
                  </Button>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}

            {(status === "idle" || status === "submitting") && (
              <div className="space-y-4">
                {/* Type selector tabs */}
                <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5">
                  {TAB_CONFIG.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setType(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                        formData.type === tab.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-title">
                    Title
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <Input
                    id="feedback-title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="Short summary of your feedback"
                    maxLength={200}
                    aria-invalid={!!validationErrors.title}
                  />
                  <div className="flex justify-between">
                    {validationErrors.title ? (
                      <span className="text-xs text-destructive">{validationErrors.title}</span>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formData.title.length}/200
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-description">
                    Description
                    <span className="text-destructive ml-0.5">*</span>
                  </Label>
                  <textarea
                    id="feedback-description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Describe your feedback in detail..."
                    maxLength={5000}
                    rows={5}
                    aria-invalid={!!validationErrors.description}
                    className="w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 resize-none"
                  />
                  <div className="flex justify-between">
                    {validationErrors.description ? (
                      <span className="text-xs text-destructive">{validationErrors.description}</span>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formData.description.length}/5000
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="feedback-email">Email (optional)</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => updateField("email", e.target.value || undefined)}
                    placeholder="your@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll only use this to follow up on your feedback.
                  </p>
                </div>

                {/* System info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="feedback-system-info"
                      checked={formData.includeSystemInfo}
                      onCheckedChange={(checked) =>
                        updateField("includeSystemInfo", checked)
                      }
                      size="sm"
                    />
                    <Label htmlFor="feedback-system-info" className="text-sm cursor-pointer">
                      Include system information
                    </Label>
                  </div>
                  {formData.includeSystemInfo && (
                    <pre className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5 font-mono leading-relaxed">
                      {getSystemInfoPreview()}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {(status === "idle" || status === "submitting") && (
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-1.5">⟳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
