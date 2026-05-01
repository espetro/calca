import { ImageIcon } from "lucide-react";
import { useRef } from "react";

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
    <button
      onClick={handleClick}
      aria-label="Add media"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
        disabled
          ? "bg-gray-100/50 text-gray-400 cursor-not-allowed border border-gray-200/50"
          : "bg-white/50 text-gray-600 hover:bg-white/80 border border-gray-200/50"
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
    </button>
  );
}
