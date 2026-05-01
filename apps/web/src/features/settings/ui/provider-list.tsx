import type { ProviderConfig } from "#/features/settings/types";

interface ProviderListProps {
  providers: ProviderConfig[];
  onRemove: (id: string) => void;
}

export default function ProviderList({ providers, onRemove }: ProviderListProps) {
  const envProvider = providers.find((p) => p.isEnv);
  const customProviders = providers.filter((p) => !p.isEnv);

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {envProvider && (
        <div className="bg-white/40 border border-teal-200/60 rounded-xl px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{envProvider.id}</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                      Env
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-[200px]">{envProvider.baseUrl}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[11px] text-gray-500">
                      {envProvider.models.length} models
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {envProvider.lastTested
                        ? `Tested ${new Date(envProvider.lastTested).toLocaleDateString()}`
                        : "Never tested"}
                    </span>
                    <span className="text-[11px] text-teal-600 flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1a4.5 4.5 0 0 0-4.5 4.5V7H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V5.5A4.5 4.5 0 0 0 8 1zm3 6H5V5.5a3 3 0 1 1 6 0V7z" />
                      </svg>
                      From environment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {customProviders.map((provider) => (
        <div
          key={provider.id}
          className="bg-white/40 border border-white/50 rounded-xl px-5 py-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">{provider.id}</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        provider.apiType === "anthropic"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {provider.apiType}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="truncate max-w-[200px]">{provider.baseUrl}</span>
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
