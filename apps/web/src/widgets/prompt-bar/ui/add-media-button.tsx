"use client";

import { useRef } from "react";
import { ImageIcon } from "lucide-react";

interface AddMediaButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function AddMediaButton({ onFileSelect, disabled = false }: AddMediaButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      event.target.value = "";
    }
  };

  const triggerFilePicker = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  return (
    <label
      onClick={triggerFilePicker}
      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm cursor-pointer transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-white/15"
      }`}
    >
      <ImageIcon className="w-4 h-4 text-gray-400" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
