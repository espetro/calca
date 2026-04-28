import { useAtom } from "jotai";

import { useMountEffect } from "#/shared/utils/use-mount-effect";

import { groupsAtom } from "../state/groups-atoms";

interface SummaryDialogProps {
  groupId: string;
  onClose: () => void;
}

export function SummaryDialog({ groupId, onClose }: SummaryDialogProps) {
  const [groups] = useAtom(groupsAtom);
  const group = groups.find((g) => g.id === groupId);

  useMountEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  if (!group || !group.summary) {
    return null;
  }

  const { title, rationale } = group.summary;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      data-tour="summary-dialog"
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-semibold text-gray-800 mb-2">{title}</h2>

        <p className="text-[13px] text-gray-500 leading-relaxed">{rationale}</p>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-black/5 hover:bg-black/10 rounded-xl text-[13px] font-medium text-gray-600 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
