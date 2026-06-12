# SEO Guide — Standards for All Projects

## Pre-Deployment SEO Checklist

Run before every live deploy:

### 1. Every Page Must Have
- [ ] Unique `<title>` (50-60 chars, primary keyword first)
- [ ] Unique `<meta name="description">` (120-155 chars)
- [ ] `<meta name="keywords">` (5-12 relevant terms)
- [ ] Canonical URL (`<link rel="canonical">`)
- [ ] Open Graph tags (og:title, og:description, og:image, og:url)
- [ ] Twitter card tags

### 2. Structured Data (JSON-LD)
- [ ] **FAQPage** schema on every tool/converter page (minimum 3 Q&A)
- [ ] **WebApplication** schema on the homepage
- [ ] **HowTo** schema where applicable
- [ ] **BreadcrumbList** on all pages

### 3. Content Requirements (to get indexed)
- [ ] Every page has **at least 150 words** of unique text content
- [ ] "About this tool" section explaining what it does
- [ ] Common conversions/examples listed
- [ ] Internal links to related pages

### 4. Technical
- [ ] Sitemap.xml includes all public pages
- [ ] robots.txt allows crawling, disallows /api/ and /admin/
- [ ] Admin pages have `<meta name="robots" content="noindex">`
- [ ] Brotli/gzip compression active
- [ ] TTFB < 200ms
- [ ] No broken links (404s)
- [ ] Mobile responsive

### 5. After Deploy
- [ ] Run SEO health check (automated)
- [ ] Request indexing in Google Search Console for new pages
- [ ] Verify structured data in Rich Results Test

## SEO Health Check Command

Run `seohealthcheck swf` or `seohealthcheck xconvert` to verify:
- All pages have FAQ schema
- No thin pages (< 150 words of content)
- All meta tags present
- No sensitive content (sanitise)
- Response times < 200ms
- Structured data validates

## Applies To
- ScrabbleWordsFinder.com
- xConvert24.com
- Any future projects
