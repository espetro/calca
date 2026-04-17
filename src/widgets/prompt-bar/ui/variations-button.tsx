"use client";

import { useRef, useState } from "react";
import { Dices } from "lucide-react";

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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
          value !== 1
            ? ""
            : "bg-white/50 text-gray-600 hover:bg-white/80 border border-gray-200/50"
        }`}
        style={
          value !== 1
            ? {
                backgroundColor: value === 2 ? "rgba(255,16,106,0.20)" : 
                               value === 3 ? "rgba(255,16,106,0.40)" :
                               value === 4 ? "rgba(255,16,106,0.65)" :
                               "#FF106A",
                color: value === 4 || value === 5 ? "#fff" : "#FF106A",
                border: value === 2 || value === 3 ? "1px solid rgba(255,16,106,0.4)" : undefined
              }
            : undefined
        }
      >
        <Dices className="w-3.5 h-3.5" />
        <span>Variations</span>
        {value !== 1 && (
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">{value}</span>
        )}
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