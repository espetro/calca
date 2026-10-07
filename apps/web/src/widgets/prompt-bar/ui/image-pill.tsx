import { X } from "lucide-react";

import type { SelectedImage } from "#/features/settings/types";
import { Button } from "#/shared/components/ui/button";

interface ImagePillProps {
  image: SelectedImage;
  onRemove: (id: string) => void;
}

export function ImagePill({ image, onRemove }: ImagePillProps) {
  const filename = image.name || "image";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass-bg/40 backdrop-blur-sm border border-glass-border/50 shadow-sm">
      <img src={image.src} alt={filename} className="w-8 h-8 rounded-full object-cover" />
      <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{filename}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(image.id)}
        className="ml-1 p-1 h-auto w-auto rounded hover:bg-foreground/10 transition-colors"
        title="Remove image"
        aria-label="Remove image"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}
