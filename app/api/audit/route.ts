import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import * as cheerio from "cheerio";
import { getReport } from "@/lib/reportStore";
import { trackPaidUnlock } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    // Verify Stripe payment
    if (!sessionId) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }
    const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim();
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    const stripeSession = await stripeRes.json() as {
      payment_status?: string;
      error?: { message: string };
    };
    if (!stripeRes.ok || stripeSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    trackPaidUnlock(sessionId);

    // New flow: retrieve stored report by ID (LLM was called during preview)
    const { fullReportId } = body;
    if (fullReportId) {
      const stored = getReport(fullReportId);
      if (!stored) {
        return NextResponse.json(
          { error: "Report expired or not found. Please run a new preview." },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...stored.report, _url: stored.url });
    }

    // Legacy flow: url provided, run full audit now
    const { url } = body;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the page
    let html: string;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PageLens/1.0; +https://pagelens.dev)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch page: HTTP ${res.status}` },
          { status: 422 }
        );
      }

      html = await res.text();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not reach the page";
      return NextResponse.json(
        { error: `Could not fetch page: ${message}` },
        { status: 422 }
      );
    }

    // Parse with cheerio
    const $ = cheerio.load(html);
    $("script, style, noscript, iframe").remove();

    const title = $("title").text().trim() || null;
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || null;

    const headings: Record<string, string[]> = {};
    for (const tag of ["h1", "h2", "h3"]) {
      headings[tag] = [];
      $(tag).each((_, el) => {
        const text = $(el).text().trim();
        if (text) headings[tag].push(text);
      });
    }

    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);

    const links: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && text) links.push(`${text} -> ${href}`);
    });

    let imagesTotal = 0;
    let imagesMissingAlt = 0;
    $("img").each((_, el) => {
      imagesTotal++;
      const alt = $(el).attr("alt");
      if (!alt || !alt.trim()) imagesMissingAlt++;
    });

    const ctaTexts: string[] = [];
    $("a, button").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 60) ctaTexts.push(text);
    });

    const pageData = {
      url,
      title,
      metaDescription,
      headings,
      bodyText: bodyText.slice(0, 4000),
      links: links.slice(0, 30),
      ctaTexts: ctaTexts.slice(0, 20),
      imagesTotal,
      imagesMissingAlt,
    };

    // Send to Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(process.env.GROQ_API_KEY || "").trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are PageLens, an expert landing page auditor. Analyze landing page data and return a JSON object with this exact structure:

{
  "overallScore": <number 0-100>,
  "sections": [
    { "title": "Value Proposition", "score": <0-100>, "summary": "<one-line>", "details": ["<observation>", "<observation>"] },
    { "title": "CTA Effectiveness", "score": <0-100>, "summary": "<one-line>", "details": ["<observation>"] },
    { "title": "Copy Quality", "score": <0-100>, "summary": "<one-line>", "details": ["<observation>"] },
    { "title": "Trust Signals", "score": <0-100>, "summary": "<one-line>", "details": ["<observation>"] }
  ],
  "improvements": ["<actionable 1>", "<actionable 2>", "<actionable 3>"],
  "seo": {
    "title": "<title or null>",
    "metaDescription": "<desc or null>",
    "h1Count": <number>,
    "headingStructure": "<brief assessment>",
    "assessment": "<overall SEO assessment>"
  }
}

Be specific, reference actual page content, give honest scores.`,
          },
          {
            role: "user",
            content: `Analyze this landing page:\n\n${JSON.stringify(pageData, null, 2)}`,
          },
        ],
      }),
    });

    const groqData = await groqRes.json() as {
      choices?: { message: { content: string } }[];
      error?: { message: string };
    };
    if (!groqRes.ok) {
      throw new Error(groqData.error?.message || "Groq API error");
    }
    const content = groqData.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const audit = JSON.parse(content);
    return NextResponse.json(audit);
  } catch (err: unknown) {
    Sentry.captureException(err);
    console.error("Audit error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";

    if (message.includes("rate limit") || message.includes("429")) {
      return NextResponse.json(
        { error: "Rate limited. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
