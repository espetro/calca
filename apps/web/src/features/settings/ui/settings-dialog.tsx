import { m } from "#/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/shared/components/ui/dialog";

import { SettingsContent } from "./settings-content";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0" showCloseButton={true}>
        <DialogTitle className="sr-only">{m.settings_title()}</DialogTitle>
        <DialogDescription className="sr-only">{m.settings_dialogDescription()}</DialogDescription>
        <SettingsContent onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
