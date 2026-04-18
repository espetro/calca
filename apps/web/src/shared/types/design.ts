export interface DesignIteration {
  id: string;
  html: string;
  label: string;
  position: import("./canvas").Point;
  width: number;
  height: number;
  prompt: string;
  comments: import("./comment").Comment[];
  isLoading?: boolean;
  isRegenerating?: boolean;
}

export interface SummaryData {
  title: string;
  rationale: string;
}

export interface GenerationGroup {
  id: string;
  prompt: string;
  iterations: DesignIteration[];
  position: import("./canvas").Point;
  createdAt: number;
  summary?: SummaryData;
}

export interface CanvasImage {
  id: string;
  dataUrl: string; // base64 data URI
  name: string;
  width: number;
  height: number;
  position: import("./canvas").Point;
  thumbnail: string; // smaller version for UI
}
