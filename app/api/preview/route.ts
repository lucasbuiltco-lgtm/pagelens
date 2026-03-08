import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { randomUUID } from "crypto";
import { storeReport } from "@/lib/reportStore";
import { saveEmail } from "@/lib/emailStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { url, email } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (email && typeof email === "string" && email.includes("@")) {
      saveEmail(email.trim(), url);
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

    // Call Groq — happens once, result is stored and reused after payment
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

    const fullReport = JSON.parse(content);
    const reportId = randomUUID();

    // Store full report — retrieved after payment
    storeReport(reportId, { report: fullReport, url, email: email?.trim() });

    // Return preview only (no details, just scores + 2 teaser improvements)
    return NextResponse.json({
      reportId,
      url,
      overallScore: fullReport.overallScore,
      sections: fullReport.sections.map((s: { title: string; score: number }) => ({
        title: s.title,
        score: s.score,
      })),
      teaserImprovements: (fullReport.improvements as string[]).slice(0, 2),
    });
  } catch (err: unknown) {
    console.error("Preview error:", err);
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
