import { useSetAtom } from "jotai";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/shared/components/ui/dialog";
import { Label } from "#/shared/components/ui/label";
import { Separator } from "#/shared/components/ui/separator";

import { resetToFactoryAtom } from "../state/settings-atoms";

export function SettingsReset() {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const resetAction = useSetAtom(resetToFactoryAtom);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{m.settings_resetTitle()}</h3>
        <p className="text-sm text-muted-foreground">{m.settings_resetDescription()}</p>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{m.settings_resetEverythingLabel()}</Label>
          <p className="text-[11px] text-muted-foreground">
            {m.settings_resetEverythingDescription()}
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
          {m.settings_resetButton()}
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.settings_resetTitle()}</DialogTitle>
            <DialogDescription>{m.settings_resetConfirmDescription()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isResetting}>
              {m.settings_cancel()}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setIsResetting(true);
                await resetAction();
              }}
              disabled={isResetting}
            >
              {isResetting ? m.settings_resetting() : m.settings_resetButton()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
