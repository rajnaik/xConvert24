# Trailing Slash — URL Architecture Rule

## Rule

All workspaces use `trailingSlash: 'always'` in `astro.config.mjs`. Every internal URL, link, API call, and route reference MUST include a trailing slash.

## What This Means

| Context | Correct | Wrong |
|---------|---------|-------|
| Page links in HTML | `/about/` | `/about` |
| API fetch calls | `/api/constants/` | `/api/constants` |
| API fetch with params | `/api/constants/?name=TAGLINE` | `/api/constants?name=TAGLINE` |
| Redirect targets | `/admin/` | `/admin` |
| Canonical URLs | `https://www.scrabblewordsfinder.com/blog/` | `https://www.scrabblewordsfinder.com/blog` |
| Internal nav hrefs | `href="/settings/"` | `href="/settings"` |
| Test URL targets | `${BASE}/admin/content/` | `${BASE}/admin/content` |
| Blog post links | `/blog/best-two-letter-words-scrabble/` | `/blog/best-two-letter-words-scrabble` |
| Sitemap entries | `<loc>https://domain.com/page/</loc>` | `<loc>https://domain.com/page</loc>` |

## Why

Astro's `trailingSlash: 'always'` config means:
1. Pages are generated at `/about/index.html` (not `/about.html`)
2. Requests to `/about` get 301-redirected to `/about/` (extra round trip)
3. Fetches to `/api/constants` may 308-redirect to `/api/constants/` causing CORS or fetch issues
4. Missing trailing slashes in API calls can cause silent failures on Workers (especially POST/PUT/DELETE which don't follow redirects)

## Config Reference

```js
// astro.config.mjs — ALL workspaces
export default defineConfig({
  trailingSlash: 'always',
  // ...
});
```

## Applies To

| Workspace | Config File |
|-----------|-------------|
| SWF | `scrabblewordsfinder/astro.config.mjs` |
| xConvert | `astro.config.mjs` |
| Coins | `coins/astro.config.mjs` |
| Playground | `playground/astro.config.mjs` |

## Checklist — Before Every Write

When writing or modifying code that contains URLs:

1. **HTML `href` attributes** — always end with `/`
2. **`fetch()` calls** — URL string always ends with `/` (before query params)
3. **`<a>` tags in Astro templates** — trailing slash on every internal link
4. **Redirect responses** — target URL has trailing slash
5. **Test assertions** — `page.goto()` URLs include trailing slash
6. **Sitemap entries** — every `<loc>` ends with `/`
7. **Canonical links** — `<link rel="canonical">` includes trailing slash
8. **Open Graph URLs** — `og:url` includes trailing slash
9. **JSON-LD schema** — any `url` field includes trailing slash
10. **Middleware redirects** — target always has trailing slash

## Common Mistake: API Fetches

This is the most frequent bug. On Cloudflare Workers, a `POST /api/foo` without trailing slash returns a **308 Permanent Redirect** to `/api/foo/`. Most `fetch()` implementations DO NOT follow redirects for non-GET methods, so the POST silently fails.

```js
// BAD — will 308 redirect and likely fail on POST/PUT/DELETE
await fetch('/api/constants', { method: 'POST', body: ... });

// GOOD — direct hit, no redirect
await fetch('/api/constants/', { method: 'POST', body: ... });
```

## Grep Check

Run this to find missing trailing slashes in internal links:

```bash
# Find href links without trailing slash (excluding external URLs and anchors)
grep -rn 'href="/' --include="*.astro" | grep -v '/"' | grep -v 'href="/#' | grep -v 'http'
```

## Exception: External URLs

External URLs (e.g., `https://xconvert24.com`, `https://github.com/...`) follow whatever convention that external site uses. This rule only applies to **internal routes**.

## Exception: Static Assets

Static files (images, CSS, JS, SVGs) do NOT get trailing slashes:
- `/favicon.svg` — correct
- `/banner-options/banner-1.svg` — correct
- `/logo-options/option-3.svg` — correct

## Agent Attribution

This is a **kiro** steering rule, created June 26, 2026.
