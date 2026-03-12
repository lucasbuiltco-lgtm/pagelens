import fs from 'fs'
import path from 'path'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface PostMeta {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  readingTime: number
}

export interface Post extends PostMeta {
  contentHtml: string
}

function fileToSlug(filename: string): string {
  return filename.replace(/\.md$/, '').replace(/^\d+-/, '')
}

function parsePostMeta(filename: string, rawContent: string): PostMeta {
  const lines = rawContent.split('\n')

  // Line 0: # Title
  const title = (lines[0] ?? '').replace(/^#\s+/, '').trim()

  // Line 2: *Published DATE | SEO keyword: ... | Category: Category*
  const metaLine = lines[2] ?? ''
  const dateMatch = metaLine.match(/Published\s+(\d{4}-\d{2}-\d{2})/)
  const categoryMatch = metaLine.match(/Category:\s*([^|*\n]+)/)
  const date = dateMatch?.[1] ?? ''
  const category = categoryMatch?.[1]?.trim() ?? ''

  // Excerpt: first non-empty, non-heading, non-separator paragraph after meta
  let excerpt = ''
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('*')) {
      excerpt = line
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      if (excerpt.length > 180) excerpt = excerpt.slice(0, 177) + '...'
      break
    }
  }

  // Reading time (~200 wpm)
  const wordCount = rawContent.split(/\s+/).filter((w) => w.length > 0).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return {
    slug: fileToSlug(filename),
    title,
    date,
    category,
    excerpt,
    readingTime,
  }
}

export function getAllPosts(): PostMeta[] {
  const filenames = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()

  return filenames.map((filename) => {
    const rawContent = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
    return parsePostMeta(filename, rawContent)
  })
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filenames = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))
  const filename = filenames.find((f) => fileToSlug(f) === slug)
  if (!filename) return null

  const rawContent = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
  const meta = parsePostMeta(filename, rawContent)

  // Strip first 4 lines (title, blank, metadata, blank) before converting to HTML
  const lines = rawContent.split('\n')
  const contentMarkdown = lines.slice(4).join('\n')

  const processedContent = await remark()
    .use(remarkHtml, { sanitize: false })
    .process(contentMarkdown)

  return {
    ...meta,
    contentHtml: processedContent.toString(),
  }
}
