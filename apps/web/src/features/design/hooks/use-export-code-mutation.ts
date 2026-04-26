import { useMutation } from "@tanstack/react-query";
import { legacyApiClient } from "@/lib/services/api";

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
  return await legacyApiClient<{ result: string }>("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
};

const useExportCodeMutation = () => {
  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: exportCode,
  });
};

export default useExportCodeMutation;
