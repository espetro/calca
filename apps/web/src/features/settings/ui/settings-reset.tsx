import { useSetAtom } from "jotai";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { resetToFactoryAtom } from "../state/settings-atoms";
import { Button } from "#/shared/components/ui/button";
import { Label } from "#/shared/components/ui/label";
import { Separator } from "#/shared/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/shared/components/ui/dialog";

export function SettingsReset() {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const resetAction = useSetAtom(resetToFactoryAtom);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Reset to Factory Settings</h3>
        <p className="text-sm text-muted-foreground">
          Clear all settings, canvas data, and preferences. This action cannot be undone.
        </p>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Reset Everything</Label>
          <p className="text-[11px] text-muted-foreground">
            This will permanently delete all your settings, canvas designs, API keys, and
            preferences.
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={isResetting}
        >
          <RotateCcw className="size-4 mr-2" />
          Reset
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to Factory Settings</DialogTitle>
            <DialogDescription>
              This will permanently delete all your settings, canvas designs, API keys, and
              preferences. The app will reload with default settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isResetting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsResetting(true);
                await resetAction();
              }}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
