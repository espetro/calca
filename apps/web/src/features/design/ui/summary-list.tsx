import { groupsAtom } from "@calca/canvas-flow";
import { useAtom } from "jotai";
import { ChevronDownIcon } from "lucide-react";

import { openSummaryIdAtom } from "#/features/design/state/generation-atoms";
import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";

export function SummaryList() {
  const [groups] = useAtom(groupsAtom);
  const [openId, setOpenId] = useAtom(openSummaryIdAtom);

  const visibleGroups = groups.filter((group) => {
    const hasCompletedIteration = group.iterations.some((it) => !it.isLoading && it.html);
    const hasSummary = Boolean(group.summary);
    return hasCompletedIteration || hasSummary;
  });

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-24 left-4 z-40 bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] max-h-72 overflow-y-auto w-[380px] max-w-[calc(100vw-2rem)]"
      data-tour="summary-list"
    >
      {visibleGroups.map((group) => {
        const hasSummary = Boolean(group.summary);
        const isOpen = hasSummary && openId === group.id;
        const title = group.summary?.title ?? m.design_summaryGenerating();

        return (
          <div key={group.id}>
            <Button
              variant="ghost"
              aria-expanded={hasSummary ? isOpen : undefined}
              onClick={() => hasSummary && setOpenId(isOpen ? null : group.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-black/5 rounded-xl transition-colors"
            >
              {hasSummary ? (
                <span className="text-emerald-500 text-sm font-bold shrink-0">✓</span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shrink-0" />
              )}
              <span
                className={`text-[13px] truncate ${
                  hasSummary ? "text-gray-700" : "text-gray-400 italic"
                }`}
              >
                {title}
              </span>
              {hasSummary && (
                <ChevronDownIcon
                  className={`ml-auto size-3.5 shrink-0 text-gray-400 transition-transform duration-200 ease-out ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </Button>

            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-3 pl-[42px] text-[12px] leading-relaxed text-gray-500">
                  {group.summary?.rationale}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
