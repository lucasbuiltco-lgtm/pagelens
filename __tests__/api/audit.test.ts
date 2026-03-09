import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/reportStore", () => ({
  getReport: vi.fn(),
  storeReport: vi.fn(),
}));

import { POST } from "@/app/api/audit/route";
import { getReport } from "@/lib/reportStore";

const mockAuditResult = {
  overallScore: 78,
  sections: [
    { title: "Value Proposition", score: 80, summary: "Good", details: ["Detail 1"] },
    { title: "CTA Effectiveness", score: 75, summary: "Decent", details: ["Detail 2"] },
    { title: "Copy Quality", score: 70, summary: "Fair", details: ["Detail 3"] },
    { title: "Trust Signals", score: 85, summary: "Strong", details: ["Detail 4"] },
  ],
  improvements: ["Improve CTA", "Add testimonials", "Better headline"],
  seo: {
    title: "Test Page",
    metaDescription: "A test page",
    h1Count: 1,
    headingStructure: "Good",
    assessment: "Solid SEO",
  },
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/audit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

const paidStripeResponse = () =>
  new Response(JSON.stringify({ payment_status: "paid" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const unpaidStripeResponse = () =>
  new Response(JSON.stringify({ payment_status: "unpaid" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

describe("POST /api/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 402 without sessionId", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.error).toBe("Payment required");
  });

  it("returns 402 with unpaid session", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(unpaidStripeResponse());
    const req = makeRequest({ sessionId: "cs_unpaid" });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });

  it("returns stored report for paid session + fullReportId", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(paidStripeResponse());
    vi.mocked(getReport).mockReturnValueOnce({
      report: mockAuditResult,
      url: "https://example.com",
      createdAt: Date.now(),
    });
    const req = makeRequest({ sessionId: "cs_paid", fullReportId: "report-123" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overallScore).toBe(78);
    expect(json._url).toBe("https://example.com");
  });

  it("returns 404 for non-existent fullReportId", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(paidStripeResponse());
    vi.mocked(getReport).mockReturnValueOnce(undefined);
    const req = makeRequest({ sessionId: "cs_paid", fullReportId: "nonexistent" });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("runs legacy flow: paid session + URL fetches page and calls Groq", async () => {
    const html =
      "<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(paidStripeResponse())
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
    const req = makeRequest({ sessionId: "cs_paid", url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.overallScore).toBe(78);
    expect(json.sections).toHaveLength(4);
    expect(json.improvements).toBeInstanceOf(Array);
  });

  it("returns 500 when Groq returns invalid JSON", async () => {
    const html = "<html><body>Content</body></html>";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(paidStripeResponse())
      .mockResolvedValueOnce(
        new Response(html, { status: 200, headers: { "Content-Type": "text/html" } })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "not valid json {{{{" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    const req = makeRequest({ sessionId: "cs_paid", url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("returns 422 when target URL is unreachable", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(paidStripeResponse())
      .mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const req = makeRequest({ sessionId: "cs_paid", url: "https://unreachable.example.com" });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 429 on Groq rate limit", async () => {
    const html = "<html><body>Content</body></html>";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(paidStripeResponse())
      .mockResolvedValueOnce(
        new Response(html, { status: 200, headers: { "Content-Type": "text/html" } })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: "rate limit exceeded" } }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )
      );
    const req = makeRequest({ sessionId: "cs_paid", url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("audit response has overallScore, 4 sections, improvements, seo", async () => {
    const html =
      "<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>";
    vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(paidStripeResponse())
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
    const req = makeRequest({ sessionId: "cs_paid", url: "https://example.com" });
    const res = await POST(req);
    const json = await res.json();
    expect(typeof json.overallScore).toBe("number");
    expect(json.sections).toHaveLength(4);
    expect(Array.isArray(json.improvements)).toBe(true);
    expect(json.seo).toBeDefined();
    expect(json.seo.assessment).toBeDefined();
  });
});
