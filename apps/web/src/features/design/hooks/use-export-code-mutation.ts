import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

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
  return await response.json();
};

const useExportCodeMutation = () => {
  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: exportCode,
  });
};

export default useExportCodeMutation;
