import type { Point } from "./canvas";
import type { Comment } from "./comment";

export interface DesignIteration {
  id: string;
  html: string;
  label: string;
  position: Point;
  width: number;
  height: number;
  prompt: string;
  comments: Comment[];
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
  position: Point;
  createdAt: number;
  summary?: SummaryData;
}

export interface CanvasImage {
  id: string;
  dataUrl: string; // Base64 data URI
  name: string;
  width: number;
  height: number;
  position: Point;
  thumbnail: string; // Smaller version for UI
}
