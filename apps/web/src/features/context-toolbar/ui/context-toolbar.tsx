import { groupsAtom } from "@app/canvas";
import { useAtomValue } from "jotai";

import { selectedIdsAtom } from "#/features/design/state/generation-atoms";
import { ExportMenu } from "#/features/export";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuViewport,
} from "#/shared/components/ui/navigation-menu";
import type { DesignIteration } from "#/shared/types";

import { RemixButton } from "./remix-button";

interface ContextToolbarProps {
  onRemix: (iteration: DesignIteration, remixPrompt: string) => void;
  apiKey?: string;
  model?: string;
  providerType?: string;
  baseURL?: string;
}

export function ContextToolbar({
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

  // TODO extract item selection logic to parent component
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

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <NavigationMenu>
        <NavigationMenuList className="rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-xl shadow-sm px-1.5 py-1 flex items-center gap-1">
          <RemixButton iteration={iteration} onRemix={onRemix} />
          <div className="w-px h-4 bg-gray-200/50" />
          <ExportMenu
            html={iteration.html ?? ""}
            label={iteration.label ?? "Design"}
            width={iteration.width ?? 480}
            apiKey={apiKey}
            model={model}
            providerType={providerType}
            baseURL={baseURL}
          />
        </NavigationMenuList>
        <NavigationMenuViewport className="mt-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-xl" />
      </NavigationMenu>
    </div>
  );
}
