"use client";

import { X } from "lucide-react";
import type { SelectedImage } from "@/features/settings/types";

interface ImagePillProps {
  image: SelectedImage;
  onRemove: (id: string) => void;
}

export function ImagePill({ image, onRemove }: ImagePillProps) {
  const displayName = image.name ?? "image";

  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/15 transition-colors cursor-default">
      <img
        src={image.src}
        alt={displayName}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">{displayName}</span>
      <button
        onClick={() => onRemove(image.id)}
        className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/20 transition-colors"
        title="Remove image"
        aria-label="Remove image"
      >
        <X className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  );
}