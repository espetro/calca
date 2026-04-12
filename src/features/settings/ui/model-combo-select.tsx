"use client";

import type { ProviderConfig } from "../../settings/types";

interface ModelComboSelectProps {
  label: string;
  value: string;
  providers: ProviderConfig[];
  onChange: (value: string) => void;
}

export default function ModelComboSelect({
  label,
  value,
  providers,
  onChange,
}: ModelComboSelectProps) {
  const hasModels = providers.some(p => p.models.length > 0);
  
  const selectedProviderAndModel = value.split("/");
  const selectedProviderId = selectedProviderAndModel[0];
  const selectedModelId = selectedProviderAndModel[1];
  
  const isValidSelection = providers.some(p => 
    p.models.some(m => `${p.id}/${m.id}` === value)
  );

  return (
    <div className="space-y-2">
      <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[13px] text-gray-800 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 outline-none border border-white/50 focus:border-blue-300/60 focus:bg-white/90 transition-all w-full"
        disabled={!hasModels}
      >
        {!hasModels ? (
          <option value="" disabled>
            No models yet — add a provider and test it to load models.
          </option>
        ) : (
          providers
            .filter(p => p.models.length > 0)
            .map(provider => (
              <optgroup key={provider.id} label={provider.id}>
                {provider.models.map(model => (
                  <option
                    key={`${provider.id}/${model.id}`}
                    value={`${provider.id}/${model.id}`}
                  >
                    {`${provider.id}/${model.displayName || model.id}`}
                  </option>
                ))}
              </optgroup>
            ))
        )}
      </select>
      
      {!isValidSelection && value && (
        <p className="text-[11px] text-amber-500 mt-1.5">
          Current selection ({value}) not found in any provider.
        </p>
      )}
    </div>
  );
}