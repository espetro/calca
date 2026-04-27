// Copyright (c) 2026 Joaquin Terrasa. All rights reserved.
// Licensed under the AGPL-3.0. See packages/shared/LICENSE for details.

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Bug, Send } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSending(true);

    // Open GitHub issues in a new tab with pre-filled info
    const title = encodeURIComponent(`Bug Report`);
    const body = encodeURIComponent(
      `## Description\n${description.trim()}\n\n---\n**App Version:** ${import.meta.env.VITE_GIT_HASH ?? "dev"}\n**User Email:** ${email.trim() || "(not provided)"}`,
    );
    window.open(
      `https://github.com/joaquindev/calca/issues/new?title=${title}&body=${body}&labels=bug`,
      "_blank",
      "noopener,noreferrer",
    );

    setSent(true);
    setSending(false);
    setTimeout(() => {
      setSent(false);
      setDescription("");
      setEmail("");
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            <Bug className="size-5 text-red-500" />
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Report a Bug
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            Found something that doesn&apos;t work? Let us know and we&apos;ll fix it.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
              <Send className="size-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-700">Opening issue tracker...</p>
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground/70 mb-1.5 block">
                What happened?
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug in detail..."
                rows={4}
                className="w-full text-sm text-foreground placeholder-foreground/30 bg-transparent border border-border/60 rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors resize-none"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/70 mb-1.5 block">
                Your email{" "}
                <span className="font-normal text-foreground/40">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-sm text-foreground placeholder-foreground/30 bg-transparent border border-border/60 rounded-xl px-3 py-2.5 outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!description.trim() || sending}
              >
                {sending ? "Opening..." : "Open Issue Tracker"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
