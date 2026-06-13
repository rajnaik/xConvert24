# Blog Category Landing Pages — Topical Cluster Hubs

## Rule

When a blog category reaches **10+ published posts**, create a category landing page at `/blog/<category-slug>`.

## What Is a Category Landing Page?

A dedicated page that lists ALL posts in one category, acting as a topical cluster hub. Google uses these to understand content hierarchy and rewards sites with clear topic groupings.

## When to Create

| Category | Slug | Trigger |
|----------|------|---------|
| Beginner Guides | `/blog/beginner-guides` | 10+ beginner posts |
| Two-Letter Words | `/blog/two-letter-words` | 10+ two-letter posts |
| Three-Letter Words | `/blog/three-letter-words` | 10+ three-letter posts |
| Strategy | `/blog/strategy` | 10+ strategy posts |
| Word Lists | `/blog/word-lists` | 10+ word list posts |
| Tournament & Competitive | `/blog/tournament` | 10+ tournament posts |
| History & Culture | `/blog/history` | 10+ history posts |

## Page Structure

```astro
---
export const prerender = true;
import BlogLayout from '../../layouts/BlogLayout.astro';
import '../../styles/global.css';
---

<BlogLayout title="[Category] — Scrabble Blog" description="..." keywords="...">
  <!-- Intro paragraph explaining the category -->
  <!-- Grid/list of ALL posts in this category with title, description, date -->
  <!-- FAQPage schema (3 Q&A about the category) -->
  <!-- Internal links to other category landing pages -->
  <!-- CTA to word finder -->
</BlogLayout>
```

## Each Card Should Include

- Post title (linked)
- Meta description (1-2 lines)
- Publication date
- Read time estimate

## SEO Benefits

- Creates topical authority (Google sees a cluster of related content)
- Provides internal link juice to all posts in the category
- Acts as an entry point for category-level keywords
- Improves crawlability (one page links to 10+ related posts)

## Auto-Check After CHOP

After every CHOP or Blog Burst command, check:
1. How many posts exist per category
2. If any category crossed the 10-post threshold
3. If yes, create the landing page automatically

## Current Category Counts (update after each CHOP)

| Category | Count | Landing Page? |
|----------|-------|--------------|
| Beginner Guides | 10 | Ready to create |
| Two-Letter Words | 10 | Ready to create |
| Three-Letter Words | 5 | Not yet |
| History & Culture | 1 | Not yet |
| Strategy | 1 | Not yet |
| Tournament | 1 | Not yet |
| Dictionaries | 1 | Not yet |

## Link From Main Blog Index

Once created, add category landing pages to the main `/blog/index.astro` as category filter buttons or sections.
