import type { ProviderType } from "@app/core/ai/providers";

interface ProviderSelectorProps {
  providerType: ProviderType | undefined;
  onProviderChange: (provider: ProviderType) => void;
  disabled?: boolean;
}

export default function ProviderSelector({ 
  providerType, 
  onProviderChange, 
  disabled = false 
}: ProviderSelectorProps) {
  const providers = [
    {
      id: 'anthropic' as const,
      label: 'Anthropic',
      description: 'Claude Opus 4.6, Sonnet 4.5, Opus 4, or Sonnet 4',
      icon: '🤖'
    },
    {
      id: 'openai-compatible' as const,
      label: 'OpenAI-Compatible',
      description: 'GPT-4, GPT-4o, GPT-3.5 Turbo, or custom endpoints',
      icon: '🚀'
    }
  ];

  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => !disabled && onProviderChange(provider.id)}
          disabled={disabled}
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
              <span className="text-[13px] font-medium">{provider.icon} {provider.label}</span>
              <span className="text-[11px] text-gray-500 ml-2">{provider.description}</span>
            </div>
          </div>
          {providerType === provider.id && !disabled && (
            <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}