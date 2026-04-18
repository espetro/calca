"use client";

import { X } from "lucide-react";
import type { SelectedImage } from "@/features/settings/types";

interface ImagePillProps {
  image: SelectedImage;
  onRemove: (id: string) => void;
}

export function ImagePill({ image, onRemove }: ImagePillProps) {
  const filename = image.name || "image";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm">
      <img
        src={image.src}
        alt={filename}
        className="w-8 h-8 rounded-full object-cover"
      />
      <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
        {filename}
      </span>
      <button
        onClick={() => onRemove(image.id)}
        className="ml-1 p-1 rounded hover:bg-white/20 transition-colors"
        title="Remove image"
        aria-label="Remove image"
      >
        <X className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  );
}
