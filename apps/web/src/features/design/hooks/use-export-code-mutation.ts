import { useMutation } from "@tanstack/react-query";

import { apiClient, apiErrorMessage } from "#/lib/api-client";
import { m } from "#/lib/i18n";

const MUTATION_KEY = ["/api/export"] as const;

interface ExportCodeProps {
  html: string;
  format: string;
  apiKey?: string;
  model?: string;
  providerType?: string;
  baseURL?: string;
}

const exportCode = async (params: ExportCodeProps) => {
  const response = await apiClient.api.export.$post({
    json: params,
  });
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, m.export_failed()));
  }
  return await response.json();
};

const useExportCodeMutation = () =>
  useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: exportCode,
  });

export default useExportCodeMutation;
