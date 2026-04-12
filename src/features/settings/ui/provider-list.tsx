"use client";

import { ProviderConfig } from "@/features/settings/types";

interface ProviderListProps {
  providers: ProviderConfig[];
  onRemove: (id: string) => void;
}

export default function ProviderList({ providers, onRemove }: ProviderListProps) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className="bg-white/40 border border-white/50 rounded-xl px-5 py-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {provider.id}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      provider.apiType === "anthropic"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {provider.apiType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-[200px]">
                      {provider.baseUrl}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[11px] text-gray-500">
                      {provider.models.length} models
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {provider.lastTested 
                        ? `Tested ${new Date(provider.lastTested).toLocaleDateString()}`
                        : "Never tested"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onRemove(provider.id)}
              className="text-[11px] text-red-500 hover:text-red-600 ml-3 px-2 py-1 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}