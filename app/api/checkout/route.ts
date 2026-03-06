import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const host = req.headers.get("host") || "pagelens.vercel.app";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = `${proto}://${host}`;
    const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();

    // Build form body manually to avoid encoding {CHECKOUT_SESSION_ID}
    const successUrl = `${baseUrl}/audit?session_id={CHECKOUT_SESSION_ID}&url=${encodeURIComponent(url)}`;
    const cancelUrl = `${baseUrl}/?cancelled=true`;

    const body = [
      "payment_method_types[0]=card",
      "line_items[0][price_data][currency]=usd",
      "line_items[0][price_data][product_data][name]=PageLens+Audit",
      "line_items[0][price_data][unit_amount]=499",
      "line_items[0][quantity]=1",
      "mode=payment",
      `success_url=${encodeURIComponent(successUrl).replace(encodeURIComponent("{CHECKOUT_SESSION_ID}"), "{CHECKOUT_SESSION_ID}")}`,
      `cancel_url=${encodeURIComponent(cancelUrl)}`,
      `metadata[url]=${encodeURIComponent(url)}`,
    ].join("&");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await res.json() as { url?: string; error?: { message: string; code?: string; type?: string } };

    if (!res.ok) {
      console.error("Stripe error full response:", JSON.stringify(data));
      return NextResponse.json({ error: data.error?.message || "Stripe error", stripeCode: data.error?.code, stripeType: data.error?.type }, { status: 500 });
    }

    return NextResponse.json({ sessionUrl: data.url });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Failed to create checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
