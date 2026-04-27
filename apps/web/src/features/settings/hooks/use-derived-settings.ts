import { useMemo } from "react";
import { type DerivedProviderFields, deriveProviderFields } from "../lib/derive-provider-fields";
import type { ProviderConfig } from "../types";

interface SettingsLike {
  providers: ProviderConfig[];
  model: string;
}

export const useDerivedSettings = (settings: SettingsLike): DerivedProviderFields =>
  useMemo(
    () => deriveProviderFields(settings.providers, settings.model),
    [settings.providers, settings.model],
  );
