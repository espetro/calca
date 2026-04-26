export type CommentStatus = "waiting" | "working" | "done";

export interface CommentMessage {
  id: string;
  role: "user" | "calca";
  text: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  position: import("./canvas").Point; // relative to the iteration
  text: string;
  number: number;
  resolved?: boolean;
  createdAt: number;
  status?: CommentStatus;
  aiResponse?: string;
  thread?: CommentMessage[];
}
