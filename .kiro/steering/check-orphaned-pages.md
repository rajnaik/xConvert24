# CheckOrphanedPages — Find Pages With Zero Inbound Links

When asked to "CheckOrphanedPages", run this command to find all pages that have no internal links pointing to them.

## Command

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && node scripts/check-orphaned-pages.mjs
```

## What It Does

1. Scans all `.astro` pages in `src/pages/` (excluding admin, api, and underscore-prefixed files)
2. For each page, counts how many OTHER pages contain an `href` pointing to it
3. Reports pages with 0 inbound links (orphans)

## Expected Output

- Total pages scanned
- Total orphaned (split by blog vs non-blog)
- List of orphaned URLs

## After Running

- New blog posts need inbound links added (per the blog-template Inbound Link Injection rule)
- Non-blog orphans may be intentional (hidden features, dynamic routes)
- Dynamic routes like `/blog/wotd/[month]/` are not real orphans — ignore them

## When to Run

- After merging new blog posts
- After every CHOP / Blog Burst
- Before staging/live deploys to catch SEO issues
- When asked "how many orphaned pages do we have"

## Agent Attribution

This is a **kiro** steering command, created July 4, 2026.
