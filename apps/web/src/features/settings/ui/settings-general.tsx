import { optIn, optOut } from "@app/analytics";
import type { ProviderType } from "@app/core/ai/providers";
import { useSetAtom } from "jotai";
import { Eye, EyeOff, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { showTutorialAtom } from "#/features/onboarding/state/onboarding-atoms";
import { m } from "#/lib/i18n";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import { Input } from "#/shared/components/ui/input";
import { Label } from "#/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/shared/components/ui/select";
import { Separator } from "#/shared/components/ui/separator";
import { Switch } from "#/shared/components/ui/switch";

import { useProbeModels } from "../hooks/use-probe-models";
import { apiKeyValidationSchema, validateModelInProvider } from "../lib/settings-schema";
import type { ProviderConfig, Settings } from "../types";

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
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
} & Record<string, unknown>) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2" {...rest}>
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
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? m.settings_hideApiKey() : m.settings_showApiKey()}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-500">{error}</p>}
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
    setBaseUrl(type === "anthropic" ? "https://api.anthropic.com/v1" : "https://api.openai.com/v1");
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!canTest) {
      return;
    }
    setTestResult(null);
    try {
      const result = await probeModels.mutateAsync({
        apiKey,
        baseURL: baseUrl,
        providerType: apiType,
      });
      if (result.error) {
        setTestResult({ message: result.error, success: false });
        setFetchedModels([]);
      } else {
        setTestResult({
          message: m.settings_testFoundModels({ count: result.models.length }),
          success: true,
        });
        setFetchedModels(result.models);
      }
    } catch {
      setTestResult({ message: m.settings_connectionFailed(), success: false });
      setFetchedModels([]);
    }
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }
    const newProvider: ProviderConfig = {
      apiKey,
      apiType,
      baseUrl,
      id: providerId,
      lastTested: Date.now(),
      models: fetchedModels,
    };
    onSave(newProvider);
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {m.settings_newProvider()}
        </Label>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={m.settings_cancel()}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {m.settings_providerIdLabel()}
        </Label>
        <Input
          value={providerId}
          onChange={(e) => {
            setProviderId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            setTestResult(null);
          }}
          placeholder={m.settings_providerIdPlaceholder()}
        />
        <p className="text-[10px] text-muted-foreground">{m.settings_providerIdHint()}</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {m.settings_apiTypeLabel()}
        </Label>
        <Select value={apiType} onValueChange={handleApiTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic">{m.settings_apiTypeOptionAnthropic()}</SelectItem>
            <SelectItem value="openai-compatible">{m.settings_apiTypeOptionOpenai()}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {m.settings_baseUrlLabel()}
        </Label>
        <Input
          value={baseUrl}
          onChange={(e) => {
            setBaseUrl(e.target.value);
            setTestResult(null);
          }}
          placeholder={
            apiType === "anthropic"
              ? m.settings_baseUrlPlaceholderAnthropic()
              : m.settings_baseUrlPlaceholderOpenai()
          }
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {m.settings_apiKeyLabel()}
        </Label>
        <div className="relative">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestResult(null);
            }}
            placeholder={
              apiType === "anthropic"
                ? m.settings_apiKeyPlaceholderAnthropic()
                : m.settings_apiKeyPlaceholderSk()
            }
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
          {probeModels.isPending ? m.settings_testing() : m.settings_testConnection()}
        </Button>
        {testResult && (
          <span className={`text-xs ${testResult.success ? "text-green-600" : "text-red-500"}`}>
            {testResult.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" type="button" onClick={handleSave} disabled={!canSave}>
          {m.settings_save()}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {m.settings_cancel()}
        </Button>
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

  const selectedProvider = useMemo(
    () => settings.providers.find((p) => p.id === selectedProviderId),
    [settings.providers, selectedProviderId],
  );

  const probeModels = useProbeModels();
  const probedProvidersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedProvider) return;
    if (selectedProvider.models.length > 0) return;
    if (probedProvidersRef.current.has(selectedProvider.id)) return;
    if (!selectedProvider.baseUrl) return;

    probedProvidersRef.current.add(selectedProvider.id);

    probeModels.mutate(
      {
        apiKey: selectedProvider.apiKey,
        baseURL: selectedProvider.baseUrl,
        providerType: selectedProvider.apiType,
      },
      {
        onSuccess: (result) => {
          if (result.models.length === 0) return;
          const updatedProviders = settings.providers.map((p) =>
            p.id === selectedProvider.id ? { ...p, models: result.models } : p,
          );
          onUpdate({ providers: updatedProviders });
        },
      },
    );
  }, [selectedProvider]);

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
    if (!selectedProvider) {
      return;
    }
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : (result.error.issues[0]?.message ?? null);
    setApiKeyErrors((prev) => ({ ...prev, [selectedProvider.id]: error }));
    const updatedProviders = settings.providers.map((p) =>
      p.id === selectedProvider.id ? { ...p, apiKey: value } : p,
    );
    onUpdate({ providers: updatedProviders });
  };

  const handleGeminiKeyChange = (value: string) => {
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : (result.error.issues[0]?.message ?? null);
    setApiKeyErrors((prev) => ({ ...prev, gemini: error }));
    onUpdate({ geminiKey: value });
  };

  const handleUnsplashKeyChange = (value: string) => {
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : (result.error.issues[0]?.message ?? null);
    setApiKeyErrors((prev) => ({ ...prev, unsplash: error }));
    onUpdate({ unsplashKey: value });
  };

  const handleOpenaiKeyChange = (value: string) => {
    const result = apiKeyValidationSchema.safeParse(value);
    const error = result.success ? null : (result.error.issues[0]?.message ?? null);
    setApiKeyErrors((prev) => ({ ...prev, openai: error }));
    onUpdate({ openaiKey: value });
  };

  const handleAnalyticsToggle = (checked: boolean) => {
    if (checked) {
      optIn();
    } else {
      optOut();
    }
    onUpdate({ analyticsEnabled: checked });
  };

  // oxlint-disable -- Model validation side-effect reacting to settings atom change. Conditional error state requires useEffect.
  useEffect(() => {
    if (selectedProvider && settings.model) {
      const error = validateModelInProvider(settings.model, selectedProvider.models);
      setModelError(error);
    }
  }, [settings.model, selectedProvider]);

  const providerLabel = selectedProvider
    ? selectedProvider.apiType === "anthropic"
      ? m.settings_providerNameAnthropic()
      : m.settings_providerNameOpenai()
    : m.settings_providerNameGeneric();

  const providerPlaceholder = selectedProvider
    ? selectedProvider.apiType === "anthropic"
      ? m.settings_apiKeyPlaceholderAnthropic()
      : m.settings_apiKeyPlaceholderSk()
    : m.settings_apiKeyPlaceholderGeneric();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {m.settings_aiProviderLabel()}
        </Label>
        <Select
          value={selectedProviderId}
          onValueChange={handleProviderChange}
          disabled={settings.providers.length === 0}
        >
          <SelectTrigger className="w-full" data-tour="settings-provider">
            <SelectValue
              placeholder={
                settings.providers.length === 0
                  ? m.settings_noProvidersConfigured()
                  : m.settings_selectProvider()
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
          {m.settings_modelLabel()}
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
                  ? m.settings_selectProviderFirst()
                  : selectedProvider.models.length === 0
                    ? m.settings_noModelsAvailable()
                    : m.settings_selectModel()
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
        {modelError && <p className="text-[11px] text-red-500">{modelError}</p>}
      </div>

      {settings.providers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_configuredProviders()}
          </Label>
          <div className="space-y-2">
            {settings.providers.map((provider) => (
              <div key={provider.id} className="rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{provider.id}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {provider.apiType === "anthropic" ? "anthropic" : "openai-compatible"}
                    </Badge>
                  </div>
                  {!provider.isEnv && (
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => handleRemoveProvider(provider.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                      aria-label={m.settings_removeProvider({ provider: provider.id })}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <span className="truncate max-w-[200px]">{provider.baseUrl}</span>
                  <span>·</span>
                  <span>{m.settings_modelsCount({ count: provider.models.length })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddProvider ? (
        <AddProviderForm onSave={handleAddProvider} onCancel={() => setShowAddProvider(false)} />
      ) : (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setShowAddProvider(true)}
          className="w-full"
          data-tour="settings-add-provider"
        >
          <Plus className="size-4 mr-2" />
          {m.settings_addProvider()}
        </Button>
      )}

      <Separator />

      <div className="space-y-4">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_apiKeysHeading()}
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            {m.settings_apiKeysDescription()}
          </p>
        </div>

        {selectedProvider && (
          <ApiKeyInput
            label={m.settings_providerApiKeyLabel({ provider: providerLabel })}
            value={selectedProvider.apiKey}
            onChange={handleProviderKeyChange}
            placeholder={providerPlaceholder}
            error={apiKeyErrors[selectedProvider.id]}
          />
        )}

        <ApiKeyInput
          label={m.settings_geminiApiKeyLabel()}
          value={settings.geminiKey}
          onChange={handleGeminiKeyChange}
          placeholder={m.settings_geminiApiKeyPlaceholder()}
          error={apiKeyErrors.gemini}
        />

        <ApiKeyInput
          label={m.settings_unsplashApiKeyLabel()}
          value={settings.unsplashKey}
          onChange={handleUnsplashKeyChange}
          placeholder={m.settings_unsplashApiKeyPlaceholder()}
          error={apiKeyErrors.unsplash}
          data-tour="settings-unsplash-key"
        />

        <ApiKeyInput
          label={m.settings_openaiApiKeyLabel()}
          value={settings.openaiKey}
          onChange={handleOpenaiKeyChange}
          placeholder={m.settings_apiKeyPlaceholderSk()}
          error={apiKeyErrors.openai}
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_analyticsLabel()}
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            {m.settings_analyticsDescription()}
          </p>
        </div>
        <Switch checked={settings.analyticsEnabled} onCheckedChange={handleAnalyticsToggle} />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {m.settings_tutorialLabel()}
          </Label>
          <p className="text-[11px] text-muted-foreground mt-1">
            {m.settings_tutorialDescription()}
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={handleRestartTour}>
          {m.settings_restartTour()}
        </Button>
      </div>
    </div>
  );
}
