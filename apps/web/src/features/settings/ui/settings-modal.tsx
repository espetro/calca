import { useState, useEffect } from "react";
import type { Settings } from "@/features/settings/types";
import ProviderList from "./provider-list";
import ProviderConfigForm from "./provider-config-form";
import ModelComboSelect from "./model-combo-select";
import { ProviderConfig, ModelInfo, ProviderType } from "../types";
interface SettingsModalProps {
  settings: Settings;
  onUpdate: (update: Partial<Settings>) => void;
  onClose: () => void;
  isOwnKey: boolean;
  providers: ProviderConfig[];
  testProvider: (config: Omit<ProviderConfig, "models" | "lastTested">) => Promise<{ models: ModelInfo[]; error?: string }>;
}

export function SettingsModal({ settings, onUpdate, onClose, isOwnKey, providers, testProvider }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState(settings.geminiKey);
  const [unsplashKey, setUnsplashKey] = useState(settings.unsplashKey);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiKey);
  const [showAddProvider, setShowAddProvider] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAddProvider = (provider: ProviderConfig) => {
    const newProviders = [...settings.providers, provider];
    onUpdate({ providers: newProviders });
    
    // If this is the first provider and it has models, auto-select its first model for both build and ideate
    if (settings.providers.length === 0 && provider.models.length > 0) {
      const firstModel = provider.models[0];
      onUpdate({
        model: `${provider.id}/${firstModel.id}`,
        ideateModel: `${provider.id}/${firstModel.id}`
      });
    }
  };

  const handleRemoveProvider = (id: string) => {
    const newProviders = settings.providers.filter(p => p.id !== id);
    onUpdate({ providers: newProviders });
    
    // If the removed provider was the source of the currently selected model, clear it or fallback to first remaining provider's first model
    const selectedModelProviderId = settings.model.split('/')[0];
    const selectedIdeateModelProviderId = settings.ideateModel?.split('/')[0];
    
    if (selectedModelProviderId === id) {
      if (newProviders.length > 0 && newProviders[0].models.length > 0) {
        const firstModel = newProviders[0].models[0];
        onUpdate({ model: `${newProviders[0].id}/${firstModel.id}` });
      } else {
        onUpdate({ model: "" });
      }
    }
    
    if (selectedIdeateModelProviderId === id) {
      if (newProviders.length > 0 && newProviders[0].models.length > 0) {
        const firstModel = newProviders[0].models[0];
        onUpdate({ ideateModel: `${newProviders[0].id}/${firstModel.id}` });
      } else {
        onUpdate({ ideateModel: undefined });
      }
    }
  };

  // Adapter for ProviderConfigForm's testProvider signature
  const testProviderAdapter = (id: string, apiType: ProviderType, baseUrl: string, apiKey: string) => {
    return testProvider({ id, apiType, baseUrl, apiKey }).then((result: { models: ModelInfo[]; error?: string }) => {
      if (result.error) {
        throw new Error(result.error);
      }
      return { models: result.models };
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] w-[540px] max-w-[92vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
          <h2 className="text-[17px] font-semibold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-black/5 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Models being used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                Models being used
              </label>
            </div>
            <div className="space-y-4">
              <ModelComboSelect
                label="Build Model"
                value={settings.model}
                providers={settings.providers}
                onChange={(value) => onUpdate({ model: value })}
              />
              <ModelComboSelect
                label="Ideate Model"
                value={settings.ideateModel || ""}
                providers={settings.providers}
                onChange={(value) => onUpdate({ ideateModel: value || undefined })}
              />
            </div>
          </div>

          {/* Configure Providers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                Configure Providers
              </label>
            </div>
            <div className="space-y-4">
              <ProviderList
                providers={settings.providers}
                onRemove={handleRemoveProvider}
              />
              
              {settings.providers.length === 0 ? (
                <button
                  onClick={() => setShowAddProvider(true)}
                  className="text-[12px] font-medium text-blue-500 hover:text-blue-600 px-4 py-2.5 rounded-xl transition-all border border-blue-300/40 bg-blue-50/30"
                >
                  Add Provider
                </button>
              ) : (
                <button
                  onClick={() => setShowAddProvider(true)}
                  className="text-[12px] font-medium text-blue-500 hover:text-blue-600 px-4 py-2.5 rounded-xl transition-all border border-blue-300/40 bg-blue-50/30"
                >
                  Add Provider
                </button>
              )}
              
              {showAddProvider && (
                <div className="bg-white/40 rounded-xl p-4 border border-white/50">
                  <ProviderConfigForm
                    onSave={handleAddProvider}
                    onCancel={() => setShowAddProvider(false)}
                    existingIds={settings.providers.map(p => p.id)}
                    testProvider={testProviderAdapter}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Image Sources */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
                🖼️ Image Sources
              </label>
              {(settings.unsplashKey || settings.openaiKey || settings.geminiKey) && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50/80 px-2 py-0.5 rounded-full">
                  {[settings.unsplashKey && "Unsplash", settings.openaiKey && "DALL·E", settings.geminiKey && "Gemini"].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Add API keys to enable real images in your designs. Claude automatically picks the best source for each image — photos from Unsplash, illustrations from DALL·E, design assets from Gemini.
            </p>

            <div className="space-y-3">
              {/* Gemini */}
              <ImageKeyField
                label="Gemini"
                icon="✨"
                desc="Design assets, UI elements, icons, patterns"
                placeholder="AIza..."
                value={geminiKey}
                savedValue={settings.geminiKey}
                onChange={setGeminiKey}
                onSave={() => onUpdate({ geminiKey: geminiKey.trim() })}
                onRemove={() => { setGeminiKey(""); onUpdate({ geminiKey: "" }); }}
                linkUrl="https://aistudio.google.com/apikey"
                linkLabel="aistudio.google.com"
              />

              {/* OpenAI / DALL-E */}
              <ImageKeyField
                label="DALL·E"
                icon="🎨"
                desc="Custom illustrations, abstract art, specific scenes"
                placeholder="sk-..."
                value={openaiKey}
                savedValue={settings.openaiKey}
                onChange={setOpenaiKey}
                onSave={() => onUpdate({ openaiKey: openaiKey.trim() })}
                onRemove={() => { setOpenaiKey(""); onUpdate({ openaiKey: "" }); }}
                linkUrl="https://platform.openai.com/api-keys"
                linkLabel="platform.openai.com"
              />

              {/* Unsplash */}
              <ImageKeyField
                label="Unsplash"
                icon="📷"
                desc="Real photos — landscapes, people, food, architecture"
                placeholder="Access key..."
                value={unsplashKey}
                savedValue={settings.unsplashKey}
                onChange={setUnsplashKey}
                onSave={() => onUpdate({ unsplashKey: unsplashKey.trim() })}
                onRemove={() => { setUnsplashKey(""); onUpdate({ unsplashKey: "" }); }}
                linkUrl="https://unsplash.com/developers"
                linkLabel="unsplash.com/developers"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200/30 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            {settings.model.split('/')[1] || settings.model}
            {settings.ideateModel && ` · 🎨 Ideate: ${settings.ideateModel.split('/')[1] || settings.ideateModel}`}
            {(settings.unsplashKey || settings.openaiKey || settings.geminiKey) && ` · 🖼️ ${[settings.unsplashKey && "Unsplash", settings.openaiKey && "DALL·E", settings.geminiKey && "Gemini"].filter(Boolean).join(", ")}`}
          </span>
          <button
            onClick={() => {
              // Auto-save keys if changed
              const updates: Partial<Settings> = {};
              if (geminiKey.trim() !== settings.geminiKey) updates.geminiKey = geminiKey.trim();
              if (unsplashKey.trim() !== settings.unsplashKey) updates.unsplashKey = unsplashKey.trim();
              if (openaiKey.trim() !== settings.openaiKey) updates.openaiKey = openaiKey.trim();
              if (Object.keys(updates).length) onUpdate(updates);
              onClose();
            }}
            className="text-[13px] font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-xl hover:bg-black/5 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageKeyField({
  label, icon, desc, placeholder, value, savedValue, onChange, onSave, onRemove, linkUrl, linkLabel,
}: {
  label: string; icon: string; desc: string; placeholder: string;
  value: string; savedValue: string;
  onChange: (v: string) => void; onSave: () => void; onRemove: () => void;
  linkUrl: string; linkLabel: string;
}) {
  const isSaved = !!savedValue;
  const isChanged = value.trim() !== savedValue;

  return (
    <div className="bg-white/40 rounded-xl p-3 border border-gray-200/30">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span className="text-[12px] font-semibold text-gray-700">{label}</span>
          {isSaved && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">
          {linkLabel} →
        </a>
      </div>
      <p className="text-[10px] text-gray-400 mb-2">{desc}</p>
      <div className="flex gap-1.5">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-[12px] text-gray-800 placeholder-gray-300 bg-white/60 rounded-lg px-3 py-2 outline-none border border-gray-200/40 focus:border-blue-300/50 transition-all font-mono"
        />
        {isChanged && value.trim() && (
          <button onClick={onSave} className="text-[11px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-all shrink-0">
            Save
          </button>
        )}
      </div>
      {isSaved && (
        <button onClick={onRemove} className="mt-1.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
          Remove key
        </button>
      )}
    </div>
  );
}
