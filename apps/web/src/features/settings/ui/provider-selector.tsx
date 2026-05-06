import type { ProviderType } from "@app/core/ai/providers";
import { Check } from "lucide-react";

import { Button } from "#/shared/components/ui/button";

interface ProviderSelectorProps {
  providerType: ProviderType | undefined;
  onProviderChange: (provider: ProviderType) => void;
  disabled?: boolean;
}

export default function ProviderSelector({
  providerType,
  onProviderChange,
  disabled = false,
}: ProviderSelectorProps) {
  const providers = [
    {
      description: "Claude Opus 4.6, Sonnet 4.5, Opus 4, or Sonnet 4",
      icon: "🤖",
      id: "anthropic" as const,
      label: "Anthropic",
    },
    {
      description: "GPT-4, GPT-4o, GPT-3.5 Turbo, or custom endpoints",
      icon: "🚀",
      id: "openai-compatible" as const,
      label: "OpenAI-Compatible",
    },
  ];

  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant="ghost"
          disabled={disabled}
          onClick={() => onProviderChange(provider.id)}
          className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-left transition-all ${
            disabled
              ? "opacity-35 cursor-not-allowed bg-gray-100/30 border border-transparent"
              : providerType === provider.id
                ? "bg-blue-500/10 border border-blue-300/40 text-gray-800"
                : "bg-white/40 border border-transparent hover:bg-white/60 text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <div>
              <span className="text-[13px] font-medium">
                {provider.icon} {provider.label}
              </span>
              <span className="text-[11px] text-gray-500 ml-2">{provider.description}</span>
            </div>
          </div>
          {providerType === provider.id && !disabled && (
            <Check className="w-4 h-4 text-blue-500 shrink-0" />
          )}
        </Button>
      ))}
    </div>
  );
}
