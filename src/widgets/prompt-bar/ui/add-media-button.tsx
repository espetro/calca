"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";

interface AddMediaButtonProps {
  onSelect: (files: File[]) => void;
}

export function AddMediaButton({ onSelect }: AddMediaButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onSelect(Array.from(e.target.files));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <label
      onClick={handleClick}
      aria-label="Add image"
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm cursor-pointer hover:bg-white/15 transition-colors"
    >
      <ImagePlus className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-700">Add image</span>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </label>
  );
}