---
inclusion: manual
---

# CheckSeoHealth — SEO Tag Health Audit

When the user says **"CheckSeoHealth"**, run a comprehensive audit of all pages' SEO tags against the saved guidelines and report findings.

## Guidelines Reference

The rules come from `.agents/skills/seo-aeo-best-practices/references/technical-seo.md`:

### Title Tags
- Unique per page
- 50–60 characters (max 70)
- Include primary keyword near the front
- Pattern: `"Primary Query Converter — Free & Instant"` or `"Tool Name — Short Benefit"`

### Meta Descriptions
- Unique per page
- 150–160 characters (under 155 for mobile safety)
- Include primary keyword
- Include a call-to-action or value proposition
- No duplicate descriptions across pages

### H1 Headings
- Exactly one H1 per page
- Contains a value proposition or primary keyword
- Converter pages: H1 should include "Converter" or "Calculator"
- Tool pages: H1 should be action-oriented

### Canonical URLs
- Every page must have a `<link rel="canonical">` tag
- Must point to the correct self-referencing URL

### Open Graph Tags
- `og:title` present
- `og:description` present
- `og:url` present
- `og:type` present

### Structured Data
- Pages should have JSON-LD where applicable (FAQ, Breadcrumb, WebApplication)

## Steps

1. **Fetch all public pages** from the site (use the test page list from `tests/comprehensive-seo.spec.ts` or crawl the sitemap).

2. **For each page, check:**
   - Title tag: exists, unique, ≤ 70 chars, contains keyword
   - Meta description: exists, unique, ≤ 160 chars, contains value prop
   - H1: exactly one, contains value keyword
   - Canonical URL: present and correct
   - Open Graph: og:title, og:description, og:url present

3. **Report findings** in a structured format:
   - ✅ Passing checks (count)
   - ⚠️ Warnings (e.g., title between 60-70 chars)
   - ❌ Failures (e.g., missing meta description, duplicate title, H1 > 1)

4. **Group failures by category:**
   - Missing meta descriptions
   - Titles too long (> 70 chars)
   - Duplicate titles
   - Missing/multiple H1s
   - Missing canonical URLs
   - Missing Open Graph tags

5. **Provide actionable recommendations** for each failing page.

## Output Format

```
╔══════════════════════════════════════════════╗
║        SEO HEALTH CHECK REPORT              ║
╠══════════════════════════════════════════════╣
║ Pages Checked:   XX                         ║
║ ✅ Passing:      XX                         ║
║ ⚠️  Warnings:    XX                         ║
║ ❌ Failures:     XX                         ║
╚══════════════════════════════════════════════╝

── FAILURES ──────────────────────────────────

🔴 Title > 70 chars (X pages):
  - /convert/body-weight-percentage (78 chars)
  - /convert/cycling-speed (72 chars)

🔴 Missing meta description (X pages):
  - /tools/password
  - /convert/cooking

🔴 Duplicate meta descriptions (X groups):
  - "Convert units..." used on: /convert/weight, /convert/length

── WARNINGS ──────────────────────────────────

🟡 Title 60-70 chars (consider shortening):
  - /tools/calculator (65 chars)

── RECOMMENDATIONS ───────────────────────────

1. Shorten title on /convert/body-weight-percentage
   Current: "Body Weight Percentage Calculator — Track Weight Loss & Gain Progress"
   Suggested: "Body Weight % Calculator — Track Loss & Gain"
```

## Environment Argument

The command takes an environment name as an argument:

- **`CheckSeoHealth dev`** → `http://localhost:4321`
- **`CheckSeoHealth staging`** → `https://staging.xconvert24.com`
- **`CheckSeoHealth live`** → `https://www.xconvert24.com`

If no environment is specified, default to **dev**.

## Important

- Use `fetch()` calls to get page HTML and parse with regex — no browser needed.
- This is a READ-ONLY audit — do not modify any files.
- After reporting, log to AuditLog with status 1 (success) and details summarizing pass/fail counts.
