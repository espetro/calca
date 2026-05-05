import { useAtom } from "jotai";
import { useCallback } from "react";

import { settingsAtom } from "#/features/settings/state/settings-atoms";

export interface ActionButtonProps {
  isGenerating: boolean;
}

const ActionButton = ({ isGenerating, dataTour }: ActionButtonProps & { dataTour?: string }) => {
  const [{ isIdeating }, setSettings] = useAtom(settingsAtom);

  const setIsIdeating = useCallback(
    (_: boolean) => setSettings((prev) => ({ ...prev, isIdeating: _ })),
    [setSettings],
  );

  return (
    <button
      onClick={() => setIsIdeating(!isIdeating)}
      disabled={isGenerating}
      data-tour={dataTour}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
      style={
        isIdeating
          ? {
              background: "var(--mode-ideate-bg)",
              border: "1px solid var(--mode-ideate-icon-bg)",
              color: "var(--mode-ideate-fg)",
            }
          : {
              background: "var(--mode-ideate-bg-subtle)",
              color: "var(--mode-ideate-fg)",
              opacity: 0.7,
            }
      }
      title={isIdeating ? "Ideate mode" : "Build mode"}
    >
      {isIdeating ? "◈ Ideate" : "✦ Build"}
    </button>
  );
};

export default ActionButton;
