import { useAtom } from "jotai";
import { useState } from "react";

import { groupsAtom } from "../state/groups-atoms";
import { SummaryDialog } from "./summary-dialog";

export function SummaryList() {
  const [groups] = useAtom(groupsAtom);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const visibleGroups = groups.filter((group) => {
    const hasCompletedIteration = group.iterations.some((it) => !it.isLoading && it.html);
    const hasSummary = Boolean(group.summary);
    return hasCompletedIteration || hasSummary;
  });

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="fixed bottom-24 left-4 z-40 bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] max-h-72 overflow-y-auto min-w-[280px]"
        data-tour="summary-list"
      >
        {visibleGroups.map((group) => {
          const hasSummary = Boolean(group.summary);
          const title = group.summary?.title ?? "Generating summary...";

          return (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-black/5 rounded-xl transition-colors"
            >
              {hasSummary ? (
                <span className="text-emerald-500 text-sm font-bold">✓</span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              )}
              <span
                className={`text-[13px] truncate ${
                  hasSummary ? "text-gray-700" : "text-gray-400 italic"
                }`}
              >
                {title}
              </span>
            </button>
          );
        })}
      </div>

      {selectedGroupId && (
        <SummaryDialog groupId={selectedGroupId} onClose={() => setSelectedGroupId(null)} />
      )}
    </>
  );
}
