import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url, fullReportId } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const host = req.headers.get("host") || "pagelens.vercel.app";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;
    const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();

    // New flow: fullReportId links back to stored report after payment
    const successUrl = fullReportId
      ? `${baseUrl}/audit?session_id={CHECKOUT_SESSION_ID}&fullReportId=${fullReportId}`
      : `${baseUrl}/audit?session_id={CHECKOUT_SESSION_ID}&url=${encodeURIComponent(url)}`;

    const cancelUrl = `${baseUrl}/preview?id=${fullReportId || ""}&cancelled=true`;

    const bodyParts = [
      "payment_method_types[0]=card",
      "line_items[0][price_data][currency]=usd",
      "line_items[0][price_data][product_data][name]=PageLens+Full+Report",
      "line_items[0][price_data][unit_amount]=499",
      "line_items[0][quantity]=1",
      "mode=payment",
      `success_url=${encodeURIComponent(successUrl).replace(
        encodeURIComponent("{CHECKOUT_SESSION_ID}"),
        "{CHECKOUT_SESSION_ID}"
      )}`,
      `cancel_url=${encodeURIComponent(cancelUrl)}`,
      `metadata[url]=${encodeURIComponent(url)}`,
    ];

    if (fullReportId) {
      bodyParts.push(`metadata[fullReportId]=${encodeURIComponent(fullReportId)}`);
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyParts.join("&"),
    });

    const data = await res.json() as {
      url?: string;
      error?: { message: string; code?: string; type?: string };
    };

    if (!res.ok) {
      console.error("Stripe error full response:", JSON.stringify(data));
      return NextResponse.json(
        {
          error: data.error?.message || "Stripe error",
          stripeCode: data.error?.code,
          stripeType: data.error?.type,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionUrl: data.url });
  } catch (err) {
    Sentry.captureException(err);
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
