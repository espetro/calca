import type { ProviderConfig, ProviderType, ModelInfo } from "../types";
import { useState, useCallback } from "react";

interface ProviderConfigFormProps {
  onSave: (provider: ProviderConfig) => void;
  onCancel: () => void;
  existingIds: string[];
  testProvider: (
    id: string,
    apiType: ProviderType,
    baseUrl: string,
    apiKey: string,
  ) => Promise<{ models: ModelInfo[] }>;
}

export default function ProviderConfigForm({
  onSave,
  onCancel,
  existingIds,
  testProvider,
}: ProviderConfigFormProps) {
  const [id, setId] = useState("");
  const [apiType, setApiType] = useState<ProviderType>("anthropic");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ models: ModelInfo[] } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Validation
  const isValidId = useCallback(
    (value: string) => {
      if (!value) return false;
      if (!/^[a-z0-9-]+$/.test(value)) return false;
      if (existingIds.includes(value)) return false;
      return true;
    },
    [existingIds],
  );

  const isDuplicate = id && existingIds.includes(id);
  const hasInvalidFormat = id && !/^[a-z0-9-]+$/.test(id);

  const duplicateError = isDuplicate ? "Provider ID already in use" : null;
  const formatError = hasInvalidFormat ? "Only lowercase letters, numbers, and hyphens" : null;

  const handleTest = async () => {
    if (!isValidId(id)) return;

    setIsTesting(true);
    setTestError(null);

    try {
      const result = await testProvider(id, apiType, baseUrl, apiKey);
      setTestResult(result);
      setTestError(null);
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "Test failed");
      setTestResult(null);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!testResult || testError) return;

    onSave({
      id,
      apiType,
      baseUrl,
      apiKey,
      models: testResult.models,
      lastTested: Date.now(),
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <div className="space-y-6">
      {/* Provider ID */}
      <div>
        <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">
          Provider ID
        </label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g., my-provider"
          className="text-[13px] text-gray-800 placeholder-gray-400/50 bg-white/70 backdrop-blur-sm rounded-xl px-5 py-3.5 outline-none border border-white/50 focus:border-blue-300/60 focus:bg-white/90 transition-all w-full"
        />
        {duplicateError && <p className="mt-1.5 text-[11px] text-red-500">{duplicateError}</p>}
        {formatError && !duplicateError && (
          <p className="mt-1.5 text-[11px] text-red-500">{formatError}</p>
        )}
      </div>

      {/* API Type Selector */}
      <div>
        <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">
          API Type
        </label>
        <div className="space-y-2">
          {[
            {
              id: "anthropic" as const,
              label: "Anthropic",
              description: "Claude Opus 4.6, Sonnet 4.5, Opus 4, or Sonnet 4",
              icon: "🤖",
            },
            {
              id: "openai-compatible" as const,
              label: "OpenAI-Compatible",
              description: "GPT-4, GPT-4o, GPT-3.5 Turbo, or custom endpoints",
              icon: "🚀",
            },
          ].map((provider) => (
            <button
              key={provider.id}
              onClick={() => setApiType(provider.id)}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl text-left transition-all ${
                apiType === provider.id
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
              {apiType === provider.id && (
                <svg
                  className="w-4 h-4 text-blue-500 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Base URL */}
      {apiType === "openai-compatible" && (
        <div>
          <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">
            Base URL
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.your-provider.com/v1"
            className="text-[13px] text-gray-800 placeholder-gray-400/50 bg-white/70 backdrop-blur-sm rounded-xl px-5 py-3.5 outline-none border border-white/50 focus:border-blue-300/60 focus:bg-white/90 transition-all w-full"
          />
        </div>
      )}

      {/* API Key */}
      <div>
        <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">
          API Key
        </label>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="flex-1 text-[13px] text-gray-800 placeholder-gray-400/50 bg-white/70 backdrop-blur-sm rounded-xl px-5 py-3.5 outline-none border border-white/50 focus:border-blue-300/60 focus:bg-white/90 transition-all font-mono"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="text-[12px] font-medium text-gray-600 bg-white/60 hover:bg-white/80 px-4 py-2.5 rounded-xl transition-all border border-white/50"
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {/* Test Button */}
      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={!isValidId(id) || isTesting}
          className={`text-[12px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all ${
            !isValidId(id) || isTesting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isTesting ? "Testing..." : "Test Provider"}
        </button>
        {testResult && (
          <span className="text-[12px] font-medium text-green-600 bg-green-50/80 px-3 py-2.5 rounded-xl">
            Found {testResult.models.length} models
          </span>
        )}
        {testError && (
          <span className="text-[12px] font-medium text-red-600 bg-red-50/80 px-3 py-2.5 rounded-xl">
            {testError}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={handleSave}
          disabled={!testResult || testError !== null}
          className={`text-[12px] font-medium text-white bg-blue-500/90 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-all ${
            !testResult || testError !== null ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          Save Provider
        </button>
        <button
          onClick={handleCancel}
          className="text-[12px] font-medium text-gray-600 bg-white/60 hover:bg-white/80 px-4 py-2.5 rounded-xl transition-all border border-white/50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
