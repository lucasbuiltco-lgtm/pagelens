import { NextResponse } from "next/server";

// In-memory counter seeded with a realistic starting number.
// Resets on cold start, which is fine for social proof display.
let auditCount = 127;

export function GET() {
  return NextResponse.json({ audits: auditCount });
}

export function POST() {
  auditCount += 1;
  return NextResponse.json({ audits: auditCount });
}
