import { useMutation } from "@tanstack/react-query";

interface ExportCodeProps {
  html: string;
  format: string;
  apiKey?: string;
  model?: string;
  providerType?: string;
  baseURL?: string;
}

const exportCode = async (params: ExportCodeProps) => {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error("Export failed");
  }

  return res.json() as Promise<{ result: string }>;
};

const useExportCodeMutation = () => {
  return useMutation({
    mutationFn: exportCode,
  });
};

export default useExportCodeMutation;
