import { NextRequest, NextResponse } from "next/server";
import { getReport } from "@/lib/reportStore";
import { hasFreeAudit, claimFreeAudit } from "@/lib/freeAuditStore";
import { trackFreeUnlock } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, fullReportId } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!fullReportId || typeof fullReportId !== "string") {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    if (hasFreeAudit(email)) {
      return NextResponse.json(
        { error: "Free audit already claimed for this email" },
        { status: 402 }
      );
    }

    const stored = getReport(fullReportId);
    if (!stored) {
      return NextResponse.json(
        { error: "Report expired or not found. Please run a new preview." },
        { status: 404 }
      );
    }

    claimFreeAudit(email);
    trackFreeUnlock(email);

    return NextResponse.json({ ...stored.report, _url: stored.url });
  } catch (err: unknown) {
    console.error("Free audit error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
