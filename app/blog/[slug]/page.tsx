import { getAllPosts, getPostBySlug } from '@/lib/blog'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://pagelens.vercel.app/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://pagelens.vercel.app/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      siteName: 'PageLens',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()

  // Related posts: same category first, then fill with others
  const related = allPosts
    .filter((p) => p.slug !== post.slug)
    .sort((a, b) => {
      const aMatch = a.category === post.category ? -1 : 0
      const bMatch = b.category === post.category ? -1 : 0
      return aMatch - bMatch
    })
    .slice(0, 3)

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
            className="text-slate-400 hover:text-white transition-colors text-sm"
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

      {/* Article */}
      <article className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-electric-400 transition-colors mb-10"
        >
          ← Back to Blog
        </Link>

        {/* Post header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-xs font-medium text-electric-400 bg-electric-500/10 px-2.5 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-slate-500">{post.date}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{post.readingTime} min read</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {post.title}
          </h1>
        </header>

        {/* Markdown content */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* CTA */}
        <div className="mt-16 p-8 bg-navy-800/50 border border-electric-500/20 rounded-2xl text-center">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-medium text-electric-400 bg-electric-500/10 border border-electric-500/20 rounded-full">
            Free for your first audit
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to audit your landing page?
          </h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Get an instant AI-powered score on copy, CTAs, trust signals, SEO, and more. Your first audit is completely free.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-electric-500 hover:bg-electric-600 text-white font-semibold rounded-xl transition-all"
          >
            Get Your Free Audit →
          </Link>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {related.map((relPost) => (
              <Link
                key={relPost.slug}
                href={`/blog/${relPost.slug}`}
                className="group flex flex-col p-6 bg-navy-800/50 border border-slate-800 rounded-2xl hover:border-electric-500/30 hover:bg-navy-800/80 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-electric-400 bg-electric-500/10 px-2.5 py-1 rounded-full">
                    {relPost.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {relPost.readingTime} min read
                  </span>
                </div>
                <h3 className="text-white font-semibold text-base leading-snug mb-2 group-hover:text-electric-400 transition-colors flex-1">
                  {relPost.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 mt-auto">
                  {relPost.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center py-10 text-slate-600 text-sm border-t border-slate-800/50">
        PageLens &mdash; AI-powered landing page auditor
      </footer>
    </main>
  )
}
