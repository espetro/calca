import { NextRequest } from "next/server";
import { handleSummary } from "@/features/design/api/summary";

export async function POST(req: NextRequest) {
  return handleSummary(req);
}
