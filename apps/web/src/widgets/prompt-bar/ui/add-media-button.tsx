"use client";

import { useRef } from "react";
import { Image } from "lucide-react";

interface AddMediaButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function AddMediaButton({ onFileSelect, disabled = false }: AddMediaButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = ""; // Reset so same file can be selected again
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <label
      onClick={handleClick}
      aria-label="Add image"
      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-3xl border border-white/30 shadow-sm cursor-pointer transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-white/25"
      }`}
    >
      <Image className="w-4 h-4 text-gray-400" />
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
