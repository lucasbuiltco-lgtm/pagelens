"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setAuditCount(d.audits))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let normalizedUrl = url.trim();
    if (!normalizedUrl) return;

    if (!email.trim()) {
      setError("Email required for your free report");
      return;
    }

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
      // Increment stats counter
      fetch("/api/stats", { method: "POST" }).catch(() => {});

      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl, email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate preview");
      }

      const preview = await res.json();
      sessionStorage.setItem("previewData", JSON.stringify(preview));
      router.push(`/preview?id=${preview.reportId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  }

  const faqs = [
    {
      q: "Is the first audit really free?",
      a: "Yes. Your first full report is completely free — just enter your email and URL. After that, additional audits are $4.99 each.",
    },
    {
      q: "What does the AI actually analyze?",
      a: "PageLens evaluates your landing page across six dimensions: value proposition clarity, CTA effectiveness, copy quality, trust signals, SEO basics, and overall page structure. Each dimension gets a letter grade and a detailed breakdown in the full report.",
    },
    {
      q: "Does it work on any URL?",
      a: "PageLens works on any publicly accessible landing page. Pages behind a login, CAPTCHA, or bot protection may not be analyzable.",
    },
    {
      q: "How long does the analysis take?",
      a: "The free preview typically takes 10–20 seconds. The full report may take a bit longer as the AI goes deeper into each category.",
    },
    {
      q: "Do I need to create an account?",
      a: "No account needed. Just provide your email to claim your free first report.",
    },
    {
      q: "Who is PageLens for?",
      a: "PageLens is built for founders, marketers, and agencies who want fast, actionable feedback on landing pages without waiting for a manual expert review.",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-2xl font-bold">
          <span className="text-electric-500">Page</span>
          <span className="text-white">Lens</span>
        </div>
        <Link
          href="/blog"
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          Blog
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-xs font-medium text-electric-400 bg-electric-500/10 border border-electric-500/20 rounded-full">
          AI-Powered Landing Page Analysis
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Your first audit is free
          <br />
          <span className="text-electric-500">on any landing page</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-4">
          Enter your email and a URL to get a complete AI audit — free for your
          first report. Additional reports are $4.99.
        </p>
        <p className="text-sm text-slate-500 mb-10">
          Trusted by marketers, founders, and agencies.
          {auditCount !== null && (
            <span className="ml-2 text-electric-400 font-medium">
              {auditCount.toLocaleString()} audits run so far.
            </span>
          )}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-5 py-4 bg-navy-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all text-lg"
              disabled={loading}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-5 py-4 bg-navy-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
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
                    Analyzing…
                  </span>
                ) : (
                  "Analyze My Page — Free"
                )}
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
          <p className="mt-3 text-xs text-slate-600">
            Your first report is always free. Additional reports: $4.99.
          </p>
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
              title: "Enter your email + URL",
              desc: "Your email unlocks your free first audit. No account required.",
            },
            {
              step: "2",
              title: "We analyze your page",
              desc: "Our AI audits your landing page across value proposition, CTAs, copy, trust signals, and SEO.",
            },
            {
              step: "3",
              title: "Get your free report",
              desc: "First audit is always free. Additional audits are $4.99.",
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

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-14">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-6">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="p-6 bg-navy-800/40 border border-slate-800 rounded-xl"
            >
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
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
