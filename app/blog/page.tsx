import { getAllPosts } from '@/lib/blog'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Landing Page Optimization Guides',
  description:
    'Expert guides on landing page audits, copywriting, SEO, conversion optimization, trust signals, and more.',
  alternates: {
    canonical: 'https://pagelens.vercel.app/blog',
  },
  openGraph: {
    title: 'PageLens Blog — Landing Page Optimization Guides',
    description:
      'Expert guides on landing page audits, copywriting, SEO, conversion optimization, trust signals, and more.',
    url: 'https://pagelens.vercel.app/blog',
    type: 'website',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="text-2xl font-bold">
          <span className="text-electric-500">Page</span>
          <span className="text-white">Lens</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/blog"
            className="text-electric-400 text-sm font-medium"
          >
            Blog
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white text-sm font-semibold rounded-lg transition-all"
          >
            Free Audit
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 text-xs font-medium text-electric-400 bg-electric-500/10 border border-electric-500/20 rounded-full">
          Landing Page Guides
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          The PageLens Blog
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Expert guides on landing page audits, copywriting, SEO, conversion
          optimization, and more.
        </p>
      </section>

      {/* Post grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col p-6 bg-navy-800/50 border border-slate-800 rounded-2xl hover:border-electric-500/30 hover:bg-navy-800/80 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-electric-400 bg-electric-500/10 px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
                <span className="text-xs text-slate-500">
                  {post.readingTime} min read
                </span>
              </div>
              <h2 className="text-white font-semibold text-lg leading-snug mb-3 group-hover:text-electric-400 transition-colors flex-1">
                {post.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/60">
                <span className="text-xs text-slate-500">{post.date}</span>
                <span className="text-electric-500 text-sm font-medium group-hover:text-electric-400 transition-colors">
                  Read more →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="p-8 bg-navy-800/50 border border-electric-500/20 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-3">
            See your landing page score
          </h2>
          <p className="text-slate-400 mb-6">
            Get a free AI-powered audit covering copy, CTAs, trust signals, SEO, and more.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-electric-500 hover:bg-electric-600 text-white font-semibold rounded-xl transition-all"
          >
            Get Your Free Audit →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 text-slate-600 text-sm border-t border-slate-800/50">
        PageLens &mdash; AI-powered landing page auditor
      </footer>
    </main>
  )
}
