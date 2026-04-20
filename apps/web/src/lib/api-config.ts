const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
