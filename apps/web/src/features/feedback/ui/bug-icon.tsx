import { useSetAtom } from "jotai";
import { Bug } from "lucide-react";

import { Button } from "#/shared/components/ui/button";

import { feedbackModalOpenAtom } from "../store";

export function BugIcon() {
  const setOpen = useSetAtom(feedbackModalOpenAtom);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpen(true)}
      title="Report a bug or share feedback"
      aria-label="Report a bug or share feedback"
      className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-toolbar-text hover:text-toolbar-text hover:bg-foreground/10"
    >
      <Bug className="w-4 h-4" />
    </Button>
  );
}
