"use client";

import { useRef, useState } from "react";
import { Layers } from "lucide-react";

interface VariationsButtonProps {
  value: number;
  onChange: (value: number) => void;
}

export function VariationsButton({ value, onChange }: VariationsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOptionClick = (option: number) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Variations"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/15 transition-colors"
      >
        <Layers className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">{value}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-10">
          <div className="flex flex-col bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg py-1 min-w-[80px]">
            {[1, 2, 3, 4].map((option) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={`px-3 py-1.5 text-sm hover:bg-white/15 transition-colors rounded-lg ${
                  option === value ? "bg-white/20" : ""
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}