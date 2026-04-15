"use client";

import { useRef, useState } from "react";

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
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
        active
          ? "bg-blue-500/20 backdrop-blur-sm border-blue-400/50 text-blue-300 shadow-sm"
          : "bg-white/10 backdrop-blur-sm border-white/20 text-gray-400 hover:bg-white/15"
      }`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span className="text-sm">Critique</span>
    </button>
  );
}