import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://pagelens.vercel.app";
const ogTitle = "PageLens — Free AI Landing Page Audit";
const ogDescription =
  "Paste any landing page URL and get an instant AI-powered score on copy, CTAs, trust signals, SEO, and more. Free preview, no account needed.";

export const metadata: Metadata = {
  title: {
    default: "PageLens — Free AI Landing Page Audit",
    template: "%s | PageLens",
  },
  description: ogDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    url: siteUrl,
    title: ogTitle,
    description: ogDescription,
    siteName: "PageLens",
    images: [
      {
        url: `https://og.vercel.app/**PageLens**%20AI%20Landing%20Page%20Audit.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`,
        width: 1200,
        height: 630,
        alt: "PageLens — AI Landing Page Auditor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: [
      `https://og.vercel.app/**PageLens**%20AI%20Landing%20Page%20Audit.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg`,
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
  keywords: [
    "landing page audit",
    "landing page analyzer",
    "AI landing page review",
    "CTA analysis",
    "copywriting audit",
    "conversion rate optimization",
    "landing page score",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PageLens",
  description: ogDescription,
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free AI landing page preview audit",
  },
  aggregateRating: undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
