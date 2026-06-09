---
inclusion: fileMatch
fileMatchPattern: "**/pages/blog/*.astro"
---

# Blog Post Template — Required Layout for All New Blog Posts

When creating any new blog post, follow this exact structure. This is non-negotiable.

---

## Frontmatter

```astro
---
import Layout from '../../layouts/Layout.astro';
import { isBlogPublished } from '../../lib/blogGate';
import BlogCrossLinks from '../../components/BlogCrossLinks.astro';

const slug = Astro.url.pathname.replace('/blog/', '').replace(/\/$/, '');
const isPublished = await isBlogPublished(slug);
if (!isPublished) return Astro.redirect('/404');
---
```

## Layout Wrapper

```html
<Layout
  title="SEO Title (max 70 chars)"
  description="Meta description (max 160 chars, include 'Free' or 'No sign-up' where applicable)"
  keywords="comma, separated, keywords"
>
```

## JSON-LD Structured Data (required)

Place immediately inside `<Layout>`, before the content div:

```html
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Same as title",
  "description": "Same as description",
  "datePublished": "YYYY-MM-DD",
  "author": { "@type": "Organization", "name": "xConvert24.com", "url": "https://www.xconvert24.com" },
  "publisher": { "@type": "Organization", "name": "xConvert24.com", "logo": { "@type": "ImageObject", "url": "https://www.xconvert24.com/web-app-manifest-512x512.png" } },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.xconvert24.com/blog/SLUG" }
})} />
```

## Content Container

```html
<div class="max-w-3xl mx-auto px-4">
  <article class="prose dark:prose-invert prose-gray max-w-none">
```

## Breadcrumb

```html
<nav class="text-sm text-gray-400 mb-6 not-prose flex items-center gap-1">
  <a href="/blog" class="hover:text-amber-500 transition-colors">← Blog</a>
  <span class="mx-1">›</span>
  <span class="text-gray-600 dark:text-gray-300">Category Name</span>
</nav>
```

## BlogCrossLinks Component

```html
<BlogCrossLinks title="Full Blog Title" />
```

## Article Meta

```html
<div class="not-prose mb-8 flex items-center gap-3 text-sm text-gray-400">
  <time datetime="YYYY-MM-DD">Month Day, Year</time>
  <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
  <span>X min read</span>
</div>
```

## Lead Paragraph

```html
<p class="text-lg leading-relaxed text-gray-600 dark:text-gray-300 mb-8">
  Opening paragraph that hooks the reader...
</p>
```

## Section Headings (h2) — IMPORTANT

Use this exact class for ALL h2 headings. This gives colored text, spacing, and the left accent bar:

```html
<h2 class="text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4">Section Title</h2>
```

## Bullet Lists

Use amber arrow markers (not green — amber is the current standard for new posts):

```html
<ul class="not-prose space-y-2 my-4">
  <li class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
    <span class="text-amber-500 mt-0.5 shrink-0">▶</span>
    <span><strong>Label:</strong> Content here</span>
  </li>
</ul>
```

## Tables

```html
<div class="overflow-x-auto not-prose my-6">
  <table class="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
    <thead class="bg-gray-100 dark:bg-gray-800">
      <tr>
        <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Column</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
      <tr class="bg-white dark:bg-gray-900"><td class="px-4 py-3">Data</td></tr>
      <tr class="bg-gray-50 dark:bg-gray-800/50"><td class="px-4 py-3">Data</td></tr>
    </tbody>
  </table>
</div>
```

## Related Articles Aside (required)

Place AFTER the last content section, BEFORE the CTA box. Link to 2-3 related blog posts:

```html
<aside class="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 not-prose">
  <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
    Related Articles
  </h3>
  <div class="grid gap-3">
    <a href="/blog/RELATED-SLUG" class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group">
      <span class="text-amber-500 group-hover:translate-x-0.5 transition-transform">→</span>
      <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Related Post Title</span>
    </a>
  </div>
</aside>
```

## Converter/Tool CTA Box (required)

```html
<div class="not-prose mt-10 p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
  <div class="flex items-center justify-between gap-4 flex-wrap">
    <p class="text-sm text-amber-800 dark:text-amber-300 font-medium">
      🔗 Try our free [tool name]
    </p>
    <a
      href="/convert/SLUG or /tools/SLUG"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
    >
      Open Converter →
    </a>
  </div>
</div>
```

## Back to Blog Link (required)

```html
<div class="not-prose mt-8 text-center">
  <a href="/blog" class="text-sm text-gray-400 hover:text-amber-500 transition-colors">
    ← Back to all articles
  </a>
</div>
```

## Closing Tags

```html
    </article>
  </div>
</Layout>
```

---

## Checklist for Every New Blog Post

1. ✅ Frontmatter with Layout, isBlogPublished, BlogCrossLinks imports
2. ✅ Blog gate check (redirect to 404 if not published)
3. ✅ JSON-LD Article structured data
4. ✅ Container: `max-w-3xl mx-auto px-4`
5. ✅ Breadcrumb with `← Blog › Category`
6. ✅ `<BlogCrossLinks>` component with title
7. ✅ Article meta with `<time>` element
8. ✅ Lead paragraph with `text-lg leading-relaxed`
9. ✅ All h2 headings: `text-xl font-light text-amber-600 dark:text-amber-400 mt-10 mb-4 border-l-4 border-amber-400 pl-4`
10. ✅ Bullet lists with amber `▶` markers
11. ✅ Related Articles aside with card-style links
12. ✅ Gradient CTA box linking to relevant converter/tool
13. ✅ "Back to all articles" link
14. ✅ Also add the blog to `BlogCrossLinks` crossLinks map if it relates to a converter
