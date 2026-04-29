import { useAtomValue } from "jotai";

import { ExportMenu } from "#/features/export";
import { groupsAtom } from "#/features/design/state/groups-atoms";
import { selectedIdsAtom } from "#/features/design/state/generation-atoms";

import { RemixButton } from "./ui/remix-button";
import type { DesignIteration } from "#/shared/types";

interface ContextToolbarProps {
  scale: number;
  offset: { x: number; y: number };
  onRemix: (iteration: DesignIteration, remixPrompt: string) => void;
  apiKey?: string;
  model?: string;
  providerType?: string;
  baseURL?: string;
}

export function ContextToolbar({
  scale,
  offset,
  onRemix,
  apiKey,
  model,
  providerType,
  baseURL,
}: ContextToolbarProps) {
  const selectedIds = useAtomValue(selectedIdsAtom);
  const groups = useAtomValue(groupsAtom);

  if (selectedIds.size !== 1) {
    return null;
  }

  const selectedId = [...selectedIds][0]!;
  let iteration: DesignIteration | undefined;
  for (const group of groups) {
    const found = group.iterations.find((it) => it.id === selectedId);
    if (found) {
      iteration = found;
      break;
    }
  }

  if (!iteration) {
    return null;
  }

  const screenX = iteration.position.x * scale + offset.x;
  const screenY = iteration.position.y * scale + offset.y;
  const scaledWidth = (iteration.width ?? 480) * scale;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ left: screenX, top: screenY - 56, transform: "translateX(-50%)" }}
    >
      <div
        className="pointer-events-auto flex items-center gap-0.5 px-2 py-1.5 rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        <RemixButton iteration={iteration} onRemix={onRemix} />
        <div className="w-px h-4 bg-gray-200/50" />
        <ExportMenu
          html={iteration.html ?? ""}
          label={iteration.label ?? "Design"}
          width={scaledWidth}
          apiKey={apiKey}
          model={model}
          providerType={providerType}
          baseURL={baseURL}
        />
      </div>
    </div>
  );
}
