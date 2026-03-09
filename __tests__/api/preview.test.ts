import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/reportStore", () => ({
  storeReport: vi.fn(),
  getReport: vi.fn(),
}));

vi.mock("@/lib/emailStore", () => ({
  saveEmail: vi.fn(),
}));

import { POST } from "@/app/api/preview/route";

const mockAuditResult = {
  overallScore: 72,
  sections: [
    { title: "Value Proposition", score: 70, summary: "Adequate", details: ["Detail A"] },
    { title: "CTA Effectiveness", score: 65, summary: "Weak", details: ["Detail B"] },
    { title: "Copy Quality", score: 80, summary: "Strong", details: ["Detail C"] },
    { title: "Trust Signals", score: 75, summary: "Good", details: ["Detail D"] },
  ],
  improvements: ["Add social proof", "Clarify headline", "Improve CTA button text"],
  seo: {
    title: "Test Page",
    metaDescription: "A test page",
    h1Count: 1,
    headingStructure: "Reasonable",
    assessment: "Decent SEO",
  },
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/preview", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 without URL", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("URL is required");
  });

  it("generates preview without requiring payment", async () => {
    const html =
      "<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(html, { status: 200, headers: { "Content-Type": "text/html" } })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(mockAuditResult) } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const req = makeRequest({ url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reportId).toBeDefined();
    expect(json.overallScore).toBe(72);
    expect(json.sections).toHaveLength(4);
    expect(json.teaserImprovements).toHaveLength(2);
  });

  it("returns 400 for invalid URL", async () => {
    const req = makeRequest({ url: "not-a-url" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 when page is unreachable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const req = makeRequest({ url: "https://unreachable.example.com" });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});
