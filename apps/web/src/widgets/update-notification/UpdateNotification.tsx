import { Moon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "#/shared/components/ui/button";

type UpdaterState =
  | { state: "idle" }
  | { state: "available"; version: string; currentVersion: string }
  | { state: "downloading" }
  | { state: "ready"; version: string };

declare global {
  interface Window {
    __calcaUpdaterStateCallback?: (state: UpdaterState) => void;
    __electrobun?: {
      receiveMessageFromBun?: (msg: unknown) => void;
      rpc?: {
        request?: Record<string, (...args: unknown[]) => Promise<unknown>>;
        send?: Record<string, (...args: unknown[]) => void>;
      };
    };
  }
}

const DISMISS_KEY = "calca:update:dismissed";

function getDismissedVersion(): string | null {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function setDismissedVersion(version: string): void {
  try {
    localStorage.setItem(DISMISS_KEY, version);
  } catch {
    return;
  }
}

function clearDismissedVersion(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    return;
  }
}

async function callRPC(method: string): Promise<void> {
  const rpc = window.__electrobun?.rpc?.request;
  if (!rpc) {
    toast.error("Updater not available");
    return;
  }

  const fn = rpc[method];
  if (typeof fn !== "function") {
    toast.error(`RPC method '${method}' not found`);
    return;
  }

  try {
    await fn();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : String(err));
  }
}

export function UpdateNotification(): React.ReactElement | null {
  const [updaterState, setUpdaterState] = useState<UpdaterState>({ state: "idle" });
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    window.__calcaUpdaterStateCallback = (newState) => setUpdaterState(newState);
    return () => {
      window.__calcaUpdaterStateCallback = undefined;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (updaterState.state === "available") {
      setDismissedVersion(updaterState.version);
    }
    setUpdaterState({ state: "idle" });
  }, [updaterState]);

  const handleDownload = useCallback(() => {
    callRPC("updater__startDownload");
  }, []);

  const handleApply = useCallback(() => {
    callRPC("updater__apply");
  }, []);

  useEffect(() => {
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    if (updaterState.state === "idle") {
      return;
    }

    if (updaterState.state === "available") {
      const dismissed = getDismissedVersion();
      if (dismissed === updaterState.version) {
        setUpdaterState({ state: "idle" });
        return;
      }
    }

    if (updaterState.state === "ready") {
      clearDismissedVersion();
    }

    const id = toast.custom(
      () => (
        <UpdateBar
          state={updaterState}
          onDismiss={handleDismiss}
          onDownload={handleDownload}
          onApply={handleApply}
        />
      ),
      {
        duration: Infinity,
        position: "bottom-center",
      },
    );
    toastIdRef.current = id;
  }, [updaterState, handleDismiss, handleDownload, handleApply]);

  return null;
}

interface UpdateBarProps {
  state: UpdaterState;
  onDismiss: () => void;
  onDownload: () => void;
  onApply: () => void;
}

function UpdateBar({ state, onDismiss, onDownload, onApply }: UpdateBarProps): React.ReactElement {
  if (state.state === "idle") {
    return <></>;
  }

  const isReady = state.state === "ready";
  const isDownloading = state.state === "downloading";
  const isAvailable = state.state === "available";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium shadow-lg border-t border-border/40"
      style={{
        background: "var(--toolbar-bg-transparent)",
        backdropFilter: "blur(16px)",
        color: "var(--toolbar-text)",
      }}
    >
      {isDownloading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Moon className="w-4 h-4 opacity-80" />
      )}

      <span className="tabular-nums">
        {isAvailable && (
          <>
            Update <span className="font-semibold">v{state.version}</span> available{" "}
            <span className="opacity-60">(current: v{state.currentVersion})</span>
          </>
        )}
        {isDownloading && "Downloading update…"}
        {isReady && (
          <>
            Ready to install <span className="font-semibold">v{state.version}</span>
          </>
        )}
      </span>

      <div className="flex items-center gap-2 ml-2">
        {isAvailable && (
          <Button variant="default" size="sm" onClick={onDownload}>
            Download
          </Button>
        )}

        {isReady && (
          <Button variant="secondary" size="sm" onClick={onApply}>
            Restart &amp; Install
          </Button>
        )}

        {isAvailable && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss update notification"
            className="opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
