# Technical SEO Checklist

Essential technical SEO elements for modern web applications.

## Site Mission & Value Props

xConvert24's core mission: **Fast, Free, No Sign-Up, Instant, Accurate.**

Every SEO tag should reinforce at least one of these value props. They reduce click-anxiety and signal trustworthiness to both users and search engines.

## Table of Contents

- Metadata
- Sitemaps
- Canonical URLs
- Redirects
- Performance
- Robots.txt
- International SEO

## Metadata

### Title Tags
- Unique per page
- 50-60 characters
- Primary keyword near the beginning
- Brand name at the end (optional)
- **Include at least one value prop:** "Free", "Instant", "No Sign-Up"
- Pattern: `"Primary Query Converter — Free & Instant"`

### Meta Descriptions
- Unique per page
- 150-160 characters (under 155 for mobile safety)
- Include call-to-action
- Contain relevant keywords
- **Must include "No sign-up" or "Free" or both**
- Pattern: `"Free [Tool Name]. [What it does]. [Accuracy/speed claim]. No sign-up required."`
- Examples:
  - `"Free Weight Converter. Convert kg to lbs, grams to ounces instantly. 100% accurate. No sign-up required."`
  - `"Free BMI Calculator. Enter height & weight for instant results with WHO categories. No sign-up needed."`

### Alt Tags
- 60-90 characters
- Descriptive and contextual
- Front-load with primary keyword
- Include "free" or "instant" where natural (e.g., "Free online BMI calculator showing instant results")
- Don't keyword-stuff
- Leave decorative images (`aria-hidden="true"`) as-is

### Open Graph
```html
<meta property="og:title" content="Page Title" />
<meta property="og:description" content="Description" />
<meta property="og:image" content="https://example.com/image.jpg" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:type" content="article" />
```

### Sanity + Next.js Implementation

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { data } = await sanityFetch({
    query: PAGE_QUERY,
    stega: false,  // Critical: no stega in metadata
  })
  
  return {
    title: data.seo?.title || data.title,
    description: data.seo?.description,
    openGraph: {
      images: data.seo?.image ? [{
        url: urlFor(data.seo.image).width(1200).height(630).url(),
        width: 1200,
        height: 630,
      }] : [],
    },
    robots: data.seo?.noIndex ? 'noindex' : undefined,
  }
}
```

## Sitemaps

Dynamic sitemap from CMS content:

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await client.fetch(`
    *[_type in ["page", "post"] && defined(slug.current) && seo.noIndex != true]{
      "url": select(
        _type == "page" => "/" + slug.current,
        _type == "post" => "/blog/" + slug.current
      ),
      _updatedAt
    }
  `)
  
  return pages.map(page => ({
    url: `https://example.com${page.url}`,
    lastModified: new Date(page._updatedAt),
    // Note: changeFrequency and priority are largely ignored by Google
    // but may be used by other search engines
  }))
}
```

## Canonical URLs

Prevent duplicate content issues:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: {
      canonical: `https://example.com/${params.slug}`,
    },
  }
}
```

## Redirects

CMS-managed redirects:

```typescript
// next.config.ts
async redirects() {
  const redirects = await client.fetch(`
    *[_type == "redirect" && isEnabled == true]{
      source,
      destination,
      permanent
    }
  `)
  return redirects
}
```

## Performance

[Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds) impact rankings:

- **LCP (Largest Contentful Paint):** < 2.5s
- **INP (Interaction to Next Paint):** < 200ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Image Optimization (Next.js example)
- Use `next/image` with Sanity URL builder
- Serve WebP/AVIF formats
- Implement LQIP blur placeholders
- Set explicit dimensions

### Font Loading (Next.js example)
```typescript
// Prevent layout shift
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
```

## Robots.txt

```
# public/robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /studio/

# AI crawlers — allow or block based on your content strategy
# Uncomment to block specific AI crawlers:
# User-agent: GPTBot
# Disallow: /
# User-agent: ClaudeBot
# Disallow: /
# User-agent: PerplexityBot
# Disallow: /
# User-agent: Google-Extended
# Disallow: /

Sitemap: https://example.com/sitemap.xml
```

**AI crawler considerations:** Decide whether AI training crawlers should access your content. Blocking `Google-Extended` prevents AI training use while still allowing Google Search indexing. Review your policy regularly as this landscape evolves.

## International SEO (hreflang)

For multi-language sites, implement hreflang tags to indicate language/region variants:

```typescript
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params
  return {
    alternates: {
      canonical: `https://example.com/${lang}/${slug}`,
      languages: {
        'en': `https://example.com/en/${slug}`,
        'de': `https://example.com/de/${slug}`,
        'x-default': `https://example.com/en/${slug}`,
      },
    },
  }
}
```

Include all language variants in sitemaps with `hreflang` annotations for proper indexing.
