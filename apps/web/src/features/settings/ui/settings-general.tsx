import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff, Plus, X } from "lucide-react";
import { useSetAtom } from "jotai";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { showTutorialAtom } from "@/features/onboarding/state/onboarding-atoms";
import { useProbeModels } from "../hooks/use-probe-models";
import type { ProviderConfig, Settings } from "../types";
import type { ProviderType } from "@app/core/ai/providers";
import {
  apiKeyValidationSchema,
  validateModelInProvider,
} from "../lib/settings-schema";

interface SettingsGeneralProps {
  settings: Settings;
  onUpdate: (update: Partial<Settings>) => void;
  onOpenChange: (open: boolean) => void;
}

function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide API key" : "Show API key"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}

function AddProviderForm({
  onSave,
  onCancel,
}: {
  onSave: (provider: ProviderConfig) => void;
  onCancel: () => void;
}) {
  const probeModels = useProbeModels();
  const [providerId, setProviderId] = useState("");
  const [apiType, setApiType] = useState<ProviderType>("openai-compatible");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fetchedModels, setFetchedModels] = useState<ProviderConfig["models"]>([]);

  const isValidId = /^[a-z0-9-]+$/.test(providerId) && providerId.length > 0;
  const canTest = isValidId && baseUrl.length > 0;
  const canSave = canTest && testResult?.success === true;

  const handleApiTypeChange = (value: string) => {
    const type = value as ProviderType;
    setApiType(type);
    setBaseUrl(
      type === "anthropic"
        ? "https://api.anthropic.com/v1"
        : "https://api.openai.com/v1"
    );
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!canTest) return;
    setTestResult(null);
    try {
      const result = await probeModels.mutateAsync({
        apiKey,
        providerType: apiType,
        baseURL: baseUrl,
      });
      if (result.error) {
        setTestResult({ success: false, message: result.error });
        setFetchedModels([]);
      } else {
        setTestResult({ success: true, message: `Found ${result.models.length} models` });
        setFetchedModels(result.models);
      }
    } catch {
      setTestResult({ success: false, message: "Connection failed" });
      setFetchedModels([]);
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    const newProvider: ProviderConfig = {
      id: providerId,
      apiType,
      baseUrl,
      apiKey,
      models: fetchedModels,
      lastTested: Date.now(),
    };
    onSave(newProvider);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          New Provider
        </Label>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cancel"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Provider ID
        </Label>
        <Input
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            setTestResult(null);
          }}
          placeholder="my-provider"
        />
        <p className="text-[10px] text-muted-foreground">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          API Type
        </Label>
        <Select value={apiType} onValueChange={handleApiTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic">Anthropic-compatible</SelectItem>
            <SelectItem value="openai-compatible">OpenAI-compatible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Base URL
        </Label>
        <Input
          value={baseUrl}
          onChange={(e) => {
            setBaseUrl(e.target.value);
            setTestResult(null);
          }}
          placeholder={
            apiType === "anthropic"
              ? "https://api.anthropic.com/v1"
              : "https://api.openai.com/v1"
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          API Key
        </Label>
        <div className="relative">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder={apiType === "anthropic" ? "sk-ant-..." : "sk-..."}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={handleTest}
          disabled={!canTest || probeModels.isPending}
        >
          {probeModels.isPending ? "Testing..." : "Test Connection"}
        </Button>
        {testResult && (
          <span
            className={`text-xs ${
              testResult.success ? "text-green-600" : "text-red-500"
            }`}
          >
            {testResult.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          type="button"
          onClick={handleSave}
          disabled={!canSave}
        >
          Save
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SettingsGeneral({ settings, onUpdate, onOpenChange }: SettingsGeneralProps) {
  const setShowTutorial = useSetAtom(showTutorialAtom);
  const [apiKeyErrors, setApiKeyErrors] = useState<Record<string, string | null>>({});
  const [modelError, setModelError] = useState<string | null>(null);
  const [showAddProvider, setShowAddProvider] = useState(false);

  const handleRestartTour = () => {
    setShowTutorial(true);
    onOpenChange(false);
  };

  const selectedProviderId = useMemo(() => {
    const slashIndex = settings.model.indexOf("/");
    return slashIndex > 0 ? settings.model.slice(0, slashIndex) : "";
  }, [settings.model]);

  const selectedModelId = useMemo(() => {
    const slashIndex = settings.model.indexOf("/");
    return slashIndex > 0 ? settings.model.slice(slashIndex + 1) : settings.model;
  }, [settings.model]);

  const selectedProvider = useMemo(() => {
    return settings.providers.find((p) => p.id === selectedProviderId);
  }, [settings.providers, selectedProviderId]);

  const handleProviderChange = (providerId: string) => {
    const provider = settings.providers.find((p) => p.id === providerId);
    if (provider && provider.models.length > 0) {
      const firstModel = provider.models[0];
      onUpdate({ model: `${provider.id}/${firstModel.id}` });
    } else {
      onUpdate({ model: `${providerId}/` });
    }
    setModelError(null);
  };

  const handleModelChange = (modelId: string) => {
    if (selectedProviderId) {
      onUpdate({ model: `${selectedProviderId}/${modelId}` });
      setModelError(null);
    }
  };

  const handleAddProvider = (provider: ProviderConfig) => {
    if (settings.providers.some((p) => p.id === provider.id)) {
      return;
    }
    const updatedProviders = [...settings.providers, provider];
    onUpdate({ providers: updatedProviders });
    if (settings.providers.length === 0 || !selectedProviderId) {
      if (provider.models.length > 0) {
        onUpdate({ model: `${provider.id}/${provider.models[0].id}` });
      }
    }
    setShowAddProvider(false);
  };

  const handleRemoveProvider = (providerId: string) => {
    const updatedProviders = settings.providers.filter((p) => p.id !== providerId);
    onUpdate({ providers: updatedProviders });
    if (selectedProviderId === providerId) {
      if (updatedProviders.length > 0 && updatedProviders[0].models.length > 0) {
        const firstProvider = updatedProviders[0];
        onUpdate({ model: `${firstProvider.id}/${firstProvider.models[0].id}` });
      } else {
        onUpdate({ model: "" });
      }
    }
  };

  const handleProviderKeyChange = (value: string) => {
    if (!selectedProvider) return;
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : result.error.issues[0]?.message ?? null;
    setApiKeyErrors((prev) => ({ ...prev, [selectedProvider.id]: error }));
    const updatedProviders = settings.providers.map((p) =>
      p.id === selectedProvider.id ? { ...p, apiKey: value } : p
    );
    onUpdate({ providers: updatedProviders });
  };

  const handleGeminiKeyChange = (value: string) => {
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : result.error.issues[0]?.message ?? null;
    setApiKeyErrors((prev) => ({ ...prev, gemini: error }));
    onUpdate({ geminiKey: value });
  };

  const handleUnsplashKeyChange = (value: string) => {
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : result.error.issues[0]?.message ?? null;
    setApiKeyErrors((prev) => ({ ...prev, unsplash: error }));
    onUpdate({ unsplashKey: value });
  };

  const handleOpenaiKeyChange = (value: string) => {
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : result.error.issues[0]?.message ?? null;
    setApiKeyErrors((prev) => ({ ...prev, openai: error }));
    onUpdate({ openaiKey: value });
  };

  useEffect(() => {
    if (selectedProvider && settings.model) {
      const error = validateModelInProvider(settings.model, selectedProvider.models);
      setModelError(error);
    }
  }, [settings.model, selectedProvider]);

  const providerLabel = selectedProvider
    ? selectedProvider.apiType === "anthropic"
      ? "Anthropic"
      : "OpenAI-Compatible"
    : "Provider";

  const providerPlaceholder = selectedProvider
    ? selectedProvider.apiType === "anthropic"
      ? "sk-ant-..."
      : "sk-..."
    : "API key...";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          AI Provider
        </Label>
        <Select
          value={selectedProviderId}
          onValueChange={handleProviderChange}
          disabled={settings.providers.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                settings.providers.length === 0
                  ? "No providers configured"
                  : "Select a provider"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {settings.providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  <span>{provider.id}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {provider.apiType === "anthropic" ? "anthropic" : "openai-compatible"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Model
        </Label>
        <Select
          value={selectedModelId}
          onValueChange={handleModelChange}
          disabled={!selectedProvider || selectedProvider.models.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !selectedProvider
                  ? "Select a provider first"
                  : selectedProvider.models.length === 0
                    ? "No models available"
                    : "Select a model"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {selectedProvider?.models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.displayName || model.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {modelError && (
          <p className="text-[11px] text-red-500">{modelError}</p>
        )}
      </div>

      {settings.providers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Configured Providers
          </Label>
          <div className="space-y-2">
            {settings.providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{provider.id}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {provider.apiType === "anthropic" ? "anthropic" : "openai-compatible"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {provider.baseUrl}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({provider.models.length} models)
                  </span>
                </div>
                {!provider.isEnv && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProvider(provider.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    aria-label={`Remove ${provider.id}`}
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddProvider ? (
        <AddProviderForm
          onSave={handleAddProvider}
          onCancel={() => setShowAddProvider(false)}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowAddProvider(true)}
          className="w-full"
        >
          <Plus className="size-4 mr-2" />
          Add Provider
        </Button>
      )}

      <Separator />

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            API Keys
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            Add API keys to enable AI design generation and image sources.
          </p>
        </div>

        {selectedProvider && (
          <ApiKeyInput
            label={`${providerLabel} API Key`}
            value={selectedProvider.apiKey}
            onChange={handleProviderKeyChange}
            placeholder={providerPlaceholder}
            error={apiKeyErrors[selectedProvider.id]}
          />
        )}

        <ApiKeyInput
          label="Gemini API Key"
          value={settings.geminiKey}
          onChange={handleGeminiKeyChange}
          placeholder="AIza..."
          error={apiKeyErrors.gemini}
        />

        <ApiKeyInput
          label="Unsplash API Key"
          value={settings.unsplashKey}
          onChange={handleUnsplashKeyChange}
          placeholder="Access key..."
          error={apiKeyErrors.unsplash}
        />

        <ApiKeyInput
          label="OpenAI API Key"
          value={settings.openaiKey}
          onChange={handleOpenaiKeyChange}
          placeholder="sk-..."
          error={apiKeyErrors.openai}
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tutorial
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            Take the tutorial again to learn about Calca's features.
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={handleRestartTour}>
          Restart tour
        </Button>
      </div>
    </div>
  );
}
