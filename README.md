# PageLens

AI-powered landing page auditor. Paste any URL and get a structured audit report with scores, insights, and actionable improvements.

## Features

- Fetches and analyzes any live landing page
- Scores value proposition, CTAs, copy quality, and trust signals
- SEO basics check (title, meta, headings)
- Top 3 actionable improvements
- Powered by GPT-4o

## Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd pagelens
npm install
```

2. Create a `.env.local` file with your OpenAI API key:

```bash
cp .env.example .env.local
# Edit .env.local and add your key
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add `OPENAI_API_KEY` as an environment variable
4. Deploy

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- OpenAI GPT-4o
- Cheerio (HTML parsing)
