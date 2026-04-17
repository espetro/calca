"use client";

import { X } from "lucide-react";
import { useRef } from "react";

interface ImagePillProps {
  image: { id: string; src: string };
  onRemove: (id: string) => void;
}

export function ImagePill({ image, onRemove }: ImagePillProps) {
  const filename = image.src.split("/").pop()?.split(".")[0] || "image";
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm">
      <img 
        src={image.src} 
        alt={filename}
        className="w-6 h-6 rounded object-cover"
      />
      <span className="text-sm text-gray-700 truncate max-w-[80px]">{filename}</span>
      <button
        onClick={() => onRemove(image.id)}
        className="ml-1 p-1 rounded hover:bg-white/10 transition-colors"
        title="Remove image"
        aria-label="Remove image"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </div>
  );
}