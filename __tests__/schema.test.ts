import { describe, it, expect } from "vitest";
import type { AuditResult } from "@/lib/reportStore";

const validAudit: AuditResult = {
  overallScore: 82,
  sections: [
    {
      title: "Value Proposition",
      score: 85,
      summary: "Clear and compelling value prop",
      details: ["Strong headline", "Clear benefits listed"],
    },
    {
      title: "CTA Effectiveness",
      score: 78,
      summary: "CTAs are visible but could be stronger",
      details: ["Single primary CTA"],
    },
    {
      title: "Copy Quality",
      score: 80,
      summary: "Good copy overall",
      details: ["Conversational tone"],
    },
    {
      title: "Trust Signals",
      score: 88,
      summary: "Strong social proof",
      details: ["Testimonials present", "Logo bar visible"],
    },
  ],
  improvements: [
    "Add urgency to CTA",
    "Include pricing comparison",
    "Add video testimonial",
  ],
  seo: {
    title: "Example Landing Page",
    metaDescription: "An example page for testing",
    h1Count: 1,
    headingStructure: "Well structured with clear hierarchy",
    assessment: "Good SEO fundamentals in place",
  },
};

describe("Audit response schema", () => {
  it("overallScore is a number between 0 and 100", () => {
    expect(typeof validAudit.overallScore).toBe("number");
    expect(validAudit.overallScore).toBeGreaterThanOrEqual(0);
    expect(validAudit.overallScore).toBeLessThanOrEqual(100);
  });

  it("sections is an array of exactly 4 objects", () => {
    expect(Array.isArray(validAudit.sections)).toBe(true);
    expect(validAudit.sections).toHaveLength(4);
  });

  it("each section has title, score, summary, and details", () => {
    for (const section of validAudit.sections) {
      expect(typeof section.title).toBe("string");
      expect(section.title.length).toBeGreaterThan(0);
      expect(typeof section.score).toBe("number");
      expect(section.score).toBeGreaterThanOrEqual(0);
      expect(section.score).toBeLessThanOrEqual(100);
      expect(typeof section.summary).toBe("string");
      expect(Array.isArray(section.details)).toBe(true);
    }
  });

  it("improvements is an array of strings", () => {
    expect(Array.isArray(validAudit.improvements)).toBe(true);
    for (const item of validAudit.improvements) {
      expect(typeof item).toBe("string");
    }
  });

  it("seo object has required fields", () => {
    const { seo } = validAudit;
    expect(seo).toBeDefined();
    expect(typeof seo.h1Count).toBe("number");
    expect(typeof seo.headingStructure).toBe("string");
    expect(typeof seo.assessment).toBe("string");
    // title and metaDescription can be string or null
    expect(seo.title === null || typeof seo.title === "string").toBe(true);
    expect(
      seo.metaDescription === null || typeof seo.metaDescription === "string"
    ).toBe(true);
  });
});
