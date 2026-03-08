"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreRing } from "@/components/ScoreRing";

interface PreviewData {
  reportId: string;
  url: string;
  overallScore: number;
  sections: { title: string; score: number }[];
  teaserImprovements: string[];
}

function scoreToGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getScoreStroke(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#facc15";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

function getGradeColor(score: number): string {
  if (score >= 80) return "text-green-400 border-green-400/30 bg-green-400/5";
  if (score >= 60) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/5";
  if (score >= 40) return "text-orange-400 border-orange-400/30 bg-orange-400/5";
  return "text-red-400 border-red-400/30 bg-red-400/5";
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-electric-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}

function PreviewContent() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    const stored = sessionStorage.getItem("previewData");
    if (stored) {
      const data = JSON.parse(stored) as PreviewData;
      if (!id || data.reportId === id) {
        setPreview(data);
        return;
      }
    }
    // No matching preview data
    router.push("/");
  }, [router, searchParams]);

  async function handleUnlock() {
    if (!preview) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: preview.url, fullReportId: preview.reportId }),
      });
      const data = await res.json();
      if (!res.ok || !data.sessionUrl) {
        throw new Error(data.error || "Failed to start checkout");
      }
      window.location.href = data.sessionUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setCheckoutError(message);
      setCheckoutLoading(false);
    }
  }

  if (!preview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-electric-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <a href="/" className="text-2xl font-bold">
          <span className="text-electric-500">Page</span>
          <span className="text-white">Lens</span>
        </a>
        <a href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
          New Audit
        </a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-medium text-electric-400 bg-electric-500/10 border border-electric-500/20 rounded-full">
            Free Preview
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Preview Report</h1>
          <p className="text-slate-500 text-sm break-all">{preview.url}</p>
        </div>

        {/* Overall Score */}
        <div className="flex flex-col items-center mb-12">
          <ScoreRing
            score={preview.overallScore}
            color={getScoreStroke(preview.overallScore)}
          />
          <p className="text-slate-400 text-sm mt-3">Overall Score</p>
        </div>

        {/* Category Grades */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-white mb-4">Category Grades</h2>
          <div className="grid grid-cols-2 gap-3">
            {preview.sections.map((section) => (
              <div
                key={section.title}
                className="flex items-center justify-between p-4 bg-navy-800/50 border border-slate-800 rounded-xl"
              >
                <span className="text-slate-300 text-sm font-medium">{section.title}</span>
                <span
                  className={`text-xl font-bold px-2 py-0.5 rounded border ${getGradeColor(section.score)}`}
                >
                  {scoreToGrade(section.score)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Teaser Issues */}
        {preview.teaserImprovements.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4">Top Issues Found</h2>
            <div className="space-y-3">
              {preview.teaserImprovements.map((issue, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-4 bg-navy-800/50 border border-slate-800 rounded-xl"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-electric-500/10 border border-electric-500/30 rounded text-electric-400 font-bold text-xs">
                    {i + 1}
                  </span>
                  <p className="text-slate-300 text-sm">{issue}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's in the Full Report */}
        <div className="mb-10 p-6 bg-navy-800/50 border border-slate-800 rounded-2xl">
          <h2 className="text-lg font-semibold text-white mb-5">What&apos;s in the Full Report</h2>
          <div className="space-y-3">
            {[
              { icon: "🔍", title: "Detailed analysis for each category", desc: "Not just letter grades — paragraph-level breakdowns of what's working and what isn't" },
              { icon: "📋", title: "Specific observations about YOUR page", desc: "References to actual copy, headlines, and elements from your page with real examples" },
              { icon: "✅", title: "Priority-ordered action items", desc: "A ranked checklist of improvements you can implement today, from quick wins to strategic changes" },
              { icon: "📊", title: "SEO technical audit", desc: "Title tags, meta descriptions, heading structure, keyword usage, and more" },
              { icon: "💡", title: "Competitor-level copywriting suggestions", desc: "Rewrites of weak copy sections with stronger alternatives you can paste in directly" },
              { icon: "🎯", title: "CTA optimization recommendations", desc: "Specific suggestions with before/after examples to increase click-through rates" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="text-xl leading-none mt-0.5">{icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blurred full report teaser */}
        <div className="relative mb-10 rounded-2xl overflow-hidden">
          <div className="p-6 bg-navy-800/50 border border-slate-800 rounded-2xl space-y-5 select-none">
            <h2 className="text-lg font-semibold text-white">Detailed Analysis</h2>

            {/* Mock category breakdowns */}
            <div className="space-y-4">
              {[
                { title: "Value Proposition", score: 62, barWidth: "w-3/5", color: "bg-yellow-400" },
                { title: "CTA Effectiveness", score: 48, barWidth: "w-2/5", color: "bg-orange-400" },
                { title: "Copy Quality", score: 71, barWidth: "w-[68%]", color: "bg-yellow-400" },
                { title: "Trust Signals", score: 55, barWidth: "w-1/2", color: "bg-orange-400" },
                { title: "SEO Structure", score: 44, barWidth: "w-[42%]", color: "bg-red-400" },
                { title: "Mobile UX", score: 78, barWidth: "w-3/4", color: "bg-green-400" },
              ].map(({ title, score, barWidth, color }) => (
                <div key={title} className="p-4 bg-navy-900/60 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{title}</span>
                    <span className="text-slate-300 text-xs font-semibold">{score}/100</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full w-full mb-3">
                    <div className={`h-2 ${color} rounded-full ${barWidth}`} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-slate-700/70 rounded w-5/6" />
                    <div className="h-2.5 bg-slate-700/70 rounded w-4/6" />
                    <div className="h-2.5 bg-slate-700/70 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-700/70 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Mock teaser improvement rows using real data */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Priority Action Items</h3>
              <div className="space-y-2">
                {(preview.teaserImprovements.length > 0
                  ? preview.teaserImprovements
                  : [
                      "Your hero headline lacks a clear outcome statement…",
                      "Consider adding testimonials from…",
                      "The primary CTA button should…",
                    ]
                ).map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-navy-900/60 border border-slate-700/50 rounded-lg">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-electric-500/10 border border-electric-500/30 rounded text-electric-400 font-bold text-xs">
                      {i + 1}
                    </span>
                    <p className="text-slate-300 text-sm">{item}</p>
                  </div>
                ))}
                {/* Extra locked rows */}
                {[
                  "Your hero headline lacks a clear outcome statement for the target persona…",
                  "Consider adding testimonials from customers who match your ICP…",
                  "The primary CTA button should use action-oriented language instead of…",
                  "Above-the-fold section does not address the visitor's primary objection…",
                  "Social proof section is positioned too far down the page to influence…",
                ].map((text, i) => (
                  <div key={`locked-${i}`} className="flex gap-3 p-3 bg-navy-900/60 border border-slate-700/50 rounded-lg">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-electric-500/10 border border-electric-500/30 rounded text-electric-400 font-bold text-xs">
                      {(preview.teaserImprovements.length || 3) + i + 1}
                    </span>
                    <p className="text-slate-300 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock copywriting suggestions */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Copywriting Suggestions</h3>
              <div className="space-y-3">
                {[
                  { label: "Hero Headline", before: "Welcome to our platform", after: "Turn your landing page into a…" },
                  { label: "CTA Button", before: "Submit", after: "Get my free…" },
                  { label: "Sub-headline", before: "We help businesses grow", after: "Stop losing visitors who…" },
                ].map(({ label, before, after }) => (
                  <div key={label} className="p-3 bg-navy-900/60 border border-slate-700/50 rounded-lg">
                    <p className="text-electric-400 text-xs font-medium mb-1.5">{label}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-red-400/80">Before:</span>
                      <span className="text-slate-400">{before}</span>
                    </div>
                    <div className="flex gap-2 text-xs mt-1">
                      <span className="text-green-400/80">After:</span>
                      <span className="text-slate-300">{after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blur overlay with top CTA */}
          <div className="absolute inset-0 backdrop-blur-[3px] bg-navy-900/70 flex flex-col items-center justify-start pt-16 gap-6 rounded-2xl px-6">
            <div className="text-center">
              <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-white font-semibold text-base mb-1">Full report locked</p>
              <p className="text-slate-400 text-sm">Unlock all {(preview.teaserImprovements.length || 3) + 5}+ action items and detailed analysis</p>
            </div>
            <button
              onClick={handleUnlock}
              disabled={checkoutLoading}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-electric-500 hover:bg-electric-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-base shadow-lg shadow-electric-500/20"
            >
              {checkoutLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirecting…
                </>
              ) : (
                "Unlock Full Report — $4.99"
              )}
            </button>
            <p className="text-slate-600 text-xs">One-time payment · Instant access · No subscription</p>
          </div>
        </div>

        {/* Social proof */}
        <div className="mb-8 p-5 bg-navy-800/30 border border-slate-800 rounded-2xl text-center space-y-2">
          <p className="text-slate-300 text-sm font-medium">Join 100+ marketers who improved their conversion rates</p>
          <p className="text-electric-400 text-sm font-semibold">Average improvement: 23% higher conversion after implementing recommendations</p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleUnlock}
            disabled={checkoutLoading}
            className="inline-flex items-center gap-2 px-10 py-4 bg-electric-500 hover:bg-electric-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-lg shadow-lg shadow-electric-500/20"
          >
            {checkoutLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting…
              </>
            ) : (
              "Unlock Full Report — $4.99"
            )}
          </button>
          {checkoutError && (
            <p className="mt-3 text-red-400 text-sm">{checkoutError}</p>
          )}
          <p className="mt-3 text-slate-600 text-xs">
            One-time payment · Instant access · No subscription
          </p>
        </div>
      </div>
    </main>
  );
}
