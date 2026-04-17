"use client";

import { useRef, useState } from "react";
import { Zap } from "lucide-react";

interface CritiqueModeButtonProps {
  active: boolean;
  onClick: () => void;
}

export function CritiqueModeButton({ active, onClick }: CritiqueModeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      aria-label="Quick mode"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
        active
          ? "bg-[#CCCCCC]/90 text-gray-700 hover:bg-[#CCCCCC]"
          : "bg-[#FFCA00]/90 text-gray-900 hover:bg-[#FFCA00]"
      }`}
    >
      <Zap className="w-3.5 h-3.5" />
      <span>Quick</span>
    </button>
  );
}