"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let normalizedUrl = url.trim();
    if (!normalizedUrl) return;

    if (
      !normalizedUrl.startsWith("http://") &&
      !normalizedUrl.startsWith("https://")
    ) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start checkout");
      }

      const { sessionUrl } = await res.json();
      window.location.href = sessionUrl;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-2xl font-bold">
          <span className="text-electric-500">Page</span>
          <span className="text-white">Lens</span>
        </div>
        <span />
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-xs font-medium text-electric-400 bg-electric-500/10 border border-electric-500/20 rounded-full">
          AI-Powered Landing Page Analysis
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Get an instant AI audit
          <br />
          <span className="text-electric-500">of any landing page</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
          Paste a URL and get a structured report on your value proposition, CTA
          effectiveness, copy quality, trust signals, and SEO — in seconds.
        </p>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-5 py-4 bg-navy-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all text-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-electric-500 hover:bg-electric-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-lg whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                "Audit Page — $4.99"
              )}
            </button>
          </div>
          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </form>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-14">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Paste a URL",
              desc: "Enter any landing page URL you want to audit.",
            },
            {
              step: "2",
              title: "We fetch & analyze",
              desc: "We scrape the page server-side and run it through our AI audit engine.",
            },
            {
              step: "3",
              title: "Get your report",
              desc: "Receive a detailed audit with scores, insights, and actionable improvements.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative p-6 bg-navy-800/50 border border-slate-800 rounded-2xl"
            >
              <div className="w-10 h-10 flex items-center justify-center bg-electric-500/10 border border-electric-500/30 rounded-lg text-electric-400 font-bold text-lg mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-14">
          What you&apos;ll get
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Overall Score",
              desc: "A 0-100 score for your landing page effectiveness.",
            },
            {
              title: "Value Proposition",
              desc: "Is your value prop clear, compelling, and visible?",
            },
            {
              title: "CTA Effectiveness",
              desc: "How strong are your calls-to-action?",
            },
            {
              title: "Copy Quality",
              desc: "Tone, clarity, persuasiveness of your copy.",
            },
            {
              title: "Trust Signals",
              desc: "Testimonials, logos, guarantees, social proof.",
            },
            {
              title: "SEO Basics",
              desc: "Title tags, meta descriptions, heading structure.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 bg-navy-900/50 border border-slate-800/50 rounded-xl"
            >
              <h3 className="text-white font-medium mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-slate-600 text-sm border-t border-slate-800/50">
        PageLens &mdash; AI-powered landing page auditor
      </footer>
    </main>
  );
}
