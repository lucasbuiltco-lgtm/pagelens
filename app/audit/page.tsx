"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreRing } from "@/components/ScoreRing";
import { AuditSection } from "@/components/AuditSection";

interface AuditResult {
  overallScore: number;
  sections: {
    title: string;
    score: number;
    summary: string;
    details: string[];
  }[];
  improvements: string[];
  seo: {
    title: string | null;
    metaDescription: string | null;
    h1Count: number;
    headingStructure: string;
    assessment: string;
  };
}

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-electric-500 border-t-transparent rounded-full" /></div>}>
      <AuditContent />
    </Suspense>
  );
}

function AuditContent() {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [auditUrl, setAuditUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const urlParam = searchParams.get("url");

    if (sessionId && urlParam) {
      // Coming from Stripe — run the audit
      setAuditUrl(urlParam);
      fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlParam, sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw new Error(data.error);
          setResult(data);
        })
        .catch((err) => setError(err.message || "Audit failed"));
      return;
    }

    // Fallback: check sessionStorage (legacy)
    const stored = sessionStorage.getItem("auditResult");
    const storedUrl = sessionStorage.getItem("auditUrl");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
    setAuditUrl(storedUrl || "");
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">{error}</p>
        <a href="/" className="text-electric-400 hover:underline">← Try again</a>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin h-8 w-8 border-2 border-electric-500 border-t-transparent rounded-full" />
        <p className="text-slate-400 text-sm">Running your audit…</p>
      </div>
    );
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  }

  function getScoreStroke(score: number) {
    if (score >= 80) return "#4ade80";
    if (score >= 60) return "#facc15";
    if (score >= 40) return "#fb923c";
    return "#f87171";
  }

  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <a href="/" className="text-2xl font-bold">
          <span className="text-electric-500">Page</span>
          <span className="text-white">Lens</span>
        </a>
        <a
          href="/"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          New Audit
        </a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Audit Report</h1>
          <p className="text-slate-400 text-sm break-all">{auditUrl}</p>
        </div>

        {/* Overall Score */}
        <div className="flex flex-col items-center mb-16">
          <ScoreRing
            score={result.overallScore}
            color={getScoreStroke(result.overallScore)}
          />
          <p
            className={`text-lg font-semibold mt-4 ${getScoreColor(result.overallScore)}`}
          >
            {result.overallScore >= 80
              ? "Great"
              : result.overallScore >= 60
                ? "Good"
                : result.overallScore >= 40
                  ? "Needs Work"
                  : "Poor"}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {result.sections.map((section) => (
            <AuditSection
              key={section.title}
              title={section.title}
              score={section.score}
              summary={section.summary}
              details={section.details}
              scoreColor={getScoreColor(section.score)}
            />
          ))}
        </div>

        {/* SEO */}
        <div className="p-6 bg-navy-800/50 border border-slate-800 rounded-2xl mb-12">
          <h2 className="text-xl font-bold text-white mb-4">SEO Basics</h2>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-slate-500 font-medium min-w-[120px]">
                Title:
              </span>
              <span className="text-slate-300">
                {result.seo.title || "Not found"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-slate-500 font-medium min-w-[120px]">
                Meta Desc:
              </span>
              <span className="text-slate-300">
                {result.seo.metaDescription || "Not found"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-slate-500 font-medium min-w-[120px]">
                H1 Count:
              </span>
              <span className="text-slate-300">{result.seo.h1Count}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-slate-500 font-medium min-w-[120px]">
                Headings:
              </span>
              <span className="text-slate-300">
                {result.seo.headingStructure}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
              <span className="text-slate-500 font-medium min-w-[120px]">
                Assessment:
              </span>
              <span className="text-slate-300">{result.seo.assessment}</span>
            </div>
          </div>
        </div>

        {/* Top Improvements */}
        <div className="p-6 bg-electric-500/5 border border-electric-500/20 rounded-2xl mb-16">
          <h2 className="text-xl font-bold text-white mb-4">
            Top 3 Improvements
          </h2>
          <ol className="space-y-3">
            {result.improvements.map((imp, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-electric-500/10 border border-electric-500/30 rounded-lg text-electric-400 font-bold text-sm">
                  {i + 1}
                </span>
                <span className="text-slate-300 text-sm pt-0.5">{imp}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block px-8 py-3 bg-electric-500 hover:bg-electric-600 text-white font-semibold rounded-xl transition-all"
          >
            Audit Another Page
          </a>
        </div>
      </div>
    </main>
  );
}
