"use client";

import { X } from "lucide-react";
import type { SelectedImage } from "@/features/settings/types";

interface ImagePillProps {
  image: SelectedImage;
  onRemove: (id: string) => void;
}

export function ImagePill({ image, onRemove }: ImagePillProps) {
  const displayName = image.name ?? "Image";

  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm hover:bg-white/15 transition-colors cursor-default">
      <img
        src={image.src}
        alt={displayName}
        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
      />
      <span className="text-sm text-gray-700 truncate max-w-[120px]">{displayName}</span>
      <button
        onClick={() => onRemove(image.id)}
        className="flex-shrink-0 p-0.5 rounded-md hover:bg-white/10 transition-colors"
        title="Remove image"
        aria-label="Remove image"
      >
        <X className="w-3.5 h-3.5 text-gray-400" />
      </button>
    </div>
  );
}