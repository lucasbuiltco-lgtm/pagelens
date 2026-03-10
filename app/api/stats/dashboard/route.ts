import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";

// Simple auth: check for a secret key in query params
// Not production-grade, but prevents casual access
export function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = (process.env.DASHBOARD_KEY || "").trim();

  if (!expected || key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(getAnalytics());
}
