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
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure your Calca preferences including AI provider, theme, and personalization
          options.
        </DialogDescription>
        <SettingsContent onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
