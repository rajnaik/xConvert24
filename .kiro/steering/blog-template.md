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


---

## Visual Enhancement Recipe — Rich Content Blocks (SWF Standard)

Plain paragraphs are NOT enough for quality blog posts. Every section should use at least one visual block. Apply these patterns to transform walls of text into scannable, engaging content.

### Available Block Types

#### 1. Insight Callout (key takeaway or pattern)
```html
<div class="not-prose my-6 p-5 rounded-xl border border-blue-500/30 bg-blue-950/20">
  <p class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">💡 Label</p>
  <p class="text-base text-gray-200">Key insight text with <span class="text-white font-medium">highlighted terms</span>.</p>
</div>
```
Colors: blue (insight), cyan (technical), green (practical), amber (warning/rule).

#### 2. Stat Strip (2-4 numbers in a row)
```html
<div class="not-prose my-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
  <div class="flex flex-wrap items-center justify-center gap-6 text-center">
    <div><p class="text-xl font-bold text-amber-400">Value</p><p class="text-xs text-gray-400">Label</p></div>
    <div><p class="text-xl font-bold text-amber-400">Value</p><p class="text-xs text-gray-400">Label</p></div>
  </div>
</div>
```

#### 3. Card Grid (information nuggets)
- **Odd count (3, 5, 7):** `grid-cols-1` (single column stack)
- **Even count (2):** `grid-cols-1 sm:grid-cols-2`
- **Even count (4):** `grid-cols-1 sm:grid-cols-2` (2×2)
- **Even count (6):** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (3×2)

```html
<div class="not-prose my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div class="p-4 rounded-xl border border-COLOR-500/30 bg-COLOR-950/10">
    <p class="text-COLOR-400 font-semibold text-sm mb-1">🏷️ Title</p>
    <p class="text-xs text-gray-400">Description text.</p>
  </div>
</div>
```
Colors by mood: purple (tips), red (barriers/warnings), green (valid/good), amber (features), gray (neutral).

#### 4. Purple Strategy Tips Tiles
Replace bullet lists of tips with purple-bordered tiles:
```html
<div class="not-prose my-6 grid grid-cols-1 gap-4">
  <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 transition-colors">
    <p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Tip title:</span> Tip content.</p>
  </div>
</div>
```

#### 5. Numbered Steps (process/path)
```html
<div class="not-prose my-6 p-5 rounded-xl border border-purple-500/30 bg-purple-950/10">
  <p class="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">🧩 Label</p>
  <div class="space-y-3">
    <div class="flex items-start gap-3">
      <span class="shrink-0 w-6 h-6 rounded-full bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-xs text-purple-300 font-bold">1</span>
      <p class="text-sm text-gray-300">Step description.</p>
    </div>
  </div>
</div>
```

#### 6. Pill Badges (small values in a row)
```html
<div class="not-prose my-6 flex flex-wrap items-center justify-center gap-3">
  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
    <span class="text-white font-bold">Label</span><span class="text-blue-400 text-xs">value</span>
  </span>
</div>
```

#### 7. Comparison Cards (valid vs invalid, pro vs con)
```html
<div class="not-prose my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div class="p-4 rounded-xl border border-green-500/30 bg-green-950/10">
    <p class="text-green-400 font-semibold text-sm mb-1">✓ Good</p>
    <p class="text-xs text-gray-400">Why this is good.</p>
  </div>
  <div class="p-4 rounded-xl border border-red-500/30 bg-red-950/10">
    <p class="text-red-400 font-semibold text-sm mb-1">✗ Bad</p>
    <p class="text-xs text-gray-400">Why this is bad.</p>
  </div>
</div>
```

#### 8. Hero/Legendary Card (for standout items)
```html
<div class="not-prose my-8 p-6 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/30 to-yellow-950/20 relative overflow-hidden">
  <div class="absolute top-3 right-4 text-xs font-bold uppercase tracking-widest text-amber-500/70">👑 Label</div>
  <p class="text-2xl font-black text-white tracking-wider mb-2">TITLE</p>
  <p class="text-sm text-amber-300 font-semibold mb-3">Subtitle stats</p>
  <p class="text-sm text-gray-300 leading-relaxed">Description.</p>
</div>
```

### Rules for Applying Visual Blocks

1. **Every h2 section** should have at least ONE visual block (callout, grid, stat strip, or card)
2. **Never have more than 2 consecutive plain `<p>` paragraphs** — break them up with a visual element
3. **Strategy Tips / bullet lists** → always use purple tiles (not `<ul>`)
4. **Numbers/stats** → always use stat strips or pill badges
5. **Comparisons** → always use side-by-side cards (green/red or any pair)
6. **Processes/steps** → always use numbered step cards
7. **Key takeaways** → always use insight callouts
8. **Lead paragraph stays as `<p>`** — that's the one exception (it's the hook)
9. **Tables are fine** — keep them for large datasets (5+ rows). Enhance with a stat strip above/below for key numbers.

### Color Guide

| Context | Border Color | Background | Text Accent |
|---------|-------------|------------|-------------|
| Insight/Pattern | `blue-500/30` | `blue-950/20` | `text-blue-400` |
| Technical/Chemical | `cyan-500/30` | `cyan-950/10` | `text-cyan-400` |
| Practical/Do This | `green-500/30` | `green-950/10` | `text-green-400` |
| Warning/Rule | `amber-500/30` | `amber-950/10` | `text-amber-400` |
| Tips/Strategy | `purple-500/30` | `purple-950/20` | `text-purple-400` |
| Danger/Barriers | `red-500/30` | `red-950/10` | `text-red-400` |
| Neutral/Data | `gray-700` | `gray-800/40` | `text-white` |


---

## Post-Treatment Prettify Step (MANDATORY)

After applying the Visual Enhancement Recipe to any blog post, **always run a prettify verification pass** before marking it done:

### Checklist (run mentally or via grep)

1. ✅ **No 3+ consecutive `<p>` paragraphs** — every section broken up with visual blocks
2. ✅ **Every h2 section has at least 1 visual block** (callout, grid, stat strip, steps, or cards)
3. ✅ **Strategy Tips use purple tiles** — not bullet lists
4. ✅ **JSON-LD Article + FAQPage schemas present** (minimum 3 Q&A)
5. ✅ **CTA box present** (blue gradient for SWF, amber for xConvert)
6. ✅ **"Back to all articles" link** at bottom
7. ✅ **Related Articles aside** with 2-3 linked posts
8. ✅ **No orphaned plain-text sections** — every content block has visual treatment

### After Passing

Log to local DB:
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx wrangler d1 execute DB --local --command "INSERT INTO test_results (test_name, status, file_changed) VALUES ('prettify: SLUG', 'pass', 'src/pages/blog/SLUG.astro');"
```

### Tracking

Keep a running count:
- **Treated + Prettified:** X posts
- **Existing (needs treatment):** Y posts
- **New (created with recipe):** Z posts
