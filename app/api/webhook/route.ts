import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { appendFileSync } from "fs";

export const runtime = "nodejs";

function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string
): boolean {
  // Parse Stripe-Signature header: t=timestamp,v1=sig,...
  const parts: Record<string, string> = {};
  for (const part of sigHeader.split(",")) {
    const [key, val] = part.split("=");
    if (key && val) parts[key.trim()] = val.trim();
  }

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Reject events older than 5 minutes
  const ts = parseInt(timestamp, 10);
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const sigHeader = req.headers.get("stripe-signature") || "";

  // Read raw body for signature verification
  const rawBody = await req.text();

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
    console.warn("Stripe webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      amount_total: number | null;
      currency: string;
      customer_details?: { email?: string };
      metadata?: { url?: string; fullReportId?: string };
    };

    const logEntry = {
      timestamp: new Date().toISOString(),
      event: "checkout.session.completed",
      sessionId: session.id,
      amountCents: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email ?? null,
      urlAudited: session.metadata?.url ?? null,
      fullReportId: session.metadata?.fullReportId ?? null,
    };

    console.log("Payment received:", JSON.stringify(logEntry));

    try {
      appendFileSync("/tmp/pagelens-payments.log", JSON.stringify(logEntry) + "\n", "utf8");
    } catch (err) {
      console.error("Failed to write payment log:", err);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
