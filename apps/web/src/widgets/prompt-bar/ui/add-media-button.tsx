"use client";

import { useRef } from "react";
import { ImageIcon } from "lucide-react";

interface AddMediaButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function AddMediaButton({ onFileSelect, disabled = false }: AddMediaButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <label
      onClick={handleClick}
      aria-label="Add media"
      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm cursor-pointer hover:bg-white/15 transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <ImageIcon className="w-4 h-4 text-gray-400" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
