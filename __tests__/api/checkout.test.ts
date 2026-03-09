import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/checkout/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 without URL", async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("URL is required");
  });

  it("returns sessionUrl with valid URL", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ url: "https://checkout.stripe.com/session123" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const req = makeRequest({ url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sessionUrl).toBe("https://checkout.stripe.com/session123");
  });

  it("calls Stripe with unit_amount=499", async () => {
    let capturedBody = "";
    vi.spyOn(global, "fetch").mockImplementationOnce(async (_url, opts) => {
      capturedBody = opts?.body as string;
      return new Response(
        JSON.stringify({ url: "https://checkout.stripe.com/x" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });
    const req = makeRequest({ url: "https://example.com" });
    await POST(req);
    expect(capturedBody).toContain("[unit_amount]=499");
  });

  it("includes fullReportId in success_url and metadata", async () => {
    let capturedBody = "";
    vi.spyOn(global, "fetch").mockImplementationOnce(async (_url, opts) => {
      capturedBody = opts?.body as string;
      return new Response(
        JSON.stringify({ url: "https://checkout.stripe.com/x" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });
    const req = makeRequest({ url: "https://example.com", fullReportId: "report-abc" });
    await POST(req);
    expect(capturedBody).toContain("fullReportId");
    expect(capturedBody).toContain("report-abc");
  });

  it("returns 500 on Stripe failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: "Invalid API key",
            code: "api_key_invalid",
            type: "authentication_error",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    );
    const req = makeRequest({ url: "https://example.com" });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Invalid API key");
  });
});
