import { ImageIcon } from "lucide-react";
import { useRef } from "react";

import { m } from "#/lib/i18n";
import { Button } from "#/shared/components/ui/button";

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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      aria-label={m.promptbar_addMedia()}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
        disabled
          ? "bg-muted/50 text-muted-foreground cursor-not-allowed border border-border/50"
          : "bg-glass-bg/60 text-muted-foreground hover:bg-glass-bg border border-border/50"
      }`}
    >
      <ImageIcon className="w-3.5 h-3.5" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
    </Button>
  );
}
