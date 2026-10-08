import { groupsAtom } from "@calca/canvas-flow";
import { useAtom } from "jotai";
import { ChevronDownIcon } from "lucide-react";

import {
  isGeneratingAtom,
  openSummaryIdAtom,
  summaryAttemptedAtom,
} from "#/features/design/state/generation-atoms";
import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";

export function SummaryList() {
  const [groups] = useAtom(groupsAtom);
  const [isGenerating] = useAtom(isGeneratingAtom);
  const [openId, setOpenId] = useAtom(openSummaryIdAtom);
  const [attemptedIds] = useAtom(summaryAttemptedAtom);

  const visibleGroups = groups.filter((group) => {
    const hasSummary = Boolean(group.summary);
    if (hasSummary) return true;
    // Pending/unavailable rows only for groups that ran this session —
    // historical groups without summaries stay hidden.
    return attemptedIds.has(group.id) && group.iterations.some((it) => !it.isLoading && it.html);
  });

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-24 left-4 z-40 bg-glass-bg backdrop-blur-2xl rounded-2xl border border-glass-border shadow-glass max-h-72 overflow-y-auto w-[380px] max-w-[calc(100vw-2rem)]"
      data-tour="summary-list"
    >
      {visibleGroups.map((group) => {
        const hasSummary = Boolean(group.summary);
        const isOpen = hasSummary && openId === group.id;
        // A finished run that produced no summary gets an honest status
        // instead of a forever-pending "Generating summary…" placeholder.
        const summaryFailed = !hasSummary && !isGenerating;
        const title =
          group.summary?.title ??
          (summaryFailed ? m.design_summaryUnavailable() : m.design_summaryGenerating());

        return (
          <div key={group.id}>
            <Button
              variant="ghost"
              aria-expanded={hasSummary ? isOpen : undefined}
              onClick={() => hasSummary && setOpenId(isOpen ? null : group.id)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-foreground/5 rounded-xl transition-colors"
            >
              {hasSummary ? (
                <span className="text-emerald-500 text-sm font-bold shrink-0">✓</span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50 shrink-0" />
              )}
              <span
                className={`text-[13px] truncate ${
                  hasSummary ? "text-foreground" : "text-muted-foreground italic"
                }`}
              >
                {title}
              </span>
              {hasSummary && (
                <ChevronDownIcon
                  className={`ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out ${
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
                <p className="px-4 pb-3 pl-[42px] text-[12px] leading-relaxed text-muted-foreground">
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
