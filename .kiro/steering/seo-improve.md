---
inclusion: manual
---

# SEOImprove Command

When the user says **"SEOImprove"**, execute all pending tasks from the `SEOImprovements` table in the dev database, applying each improvement to the codebase.

---

## Steps

1. **Fetch pending tasks** — Query the dev DB for all rows with `status = 'pending'` ordered by priority (high first):
   ```sql
   SELECT * FROM SEOImprovements WHERE status = 'pending' ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END;
   ```

2. **Execute each task** based on its `category`:

### Category: `title-tags`
- Open each converter page listed in `pages_affected`
- Rewrite the `title` prop to lead with the most-searched conversion pair for that page
- **2026 Standard**: Keep between 50–60 characters total (before the `| xConvert24.com` suffix)
- Put your most valuable keyword at the **very beginning** of the title
- Add a value prop like "Instant & Accurate" or "Free & Fast"
- Title format: `"Primary Query Converter — Value Prop"`
- Examples:
  - weight: `"KG to Lbs Converter — Instant & Accurate"`
  - temperature: `"Celsius to Fahrenheit Converter — Free & Fast"`
  - length: `"KM to Miles Converter — Free & Instant"`
  - speed: `"KM/H to MPH Converter — Fast & Free"`
  - volume: `"Liters to Gallons Converter — Free & Instant"`
  - data: `"MB to GB Converter — Free & Accurate"`
  - pressure: `"PSI to Bar Converter — Instant & Free"`
  - power: `"Watts to HP Converter — Fast & Accurate"`
  - fuel: `"MPG to L/100km Converter — Free & Instant"`
  - area: `"Square Meters to Feet Converter — Free & Fast"`
  - homepage: `"Free Online Unit Converter — 34+ Tools"`

### Category: `headers`
- **H1 Rule (2026)**: Each page must have exactly **one** H1 that clearly states the page's purpose
  - GOOD: `"34+ Instant Converters & Calculators"` or `"Weight & Mass Converter — KG, Lbs, Ounces, Stones"`
  - BAD: `"Home"` or just `"xConvert24"`
  - Pattern: `"[Type] Converter — [Unit1], [Unit2], [Unit3], [Unit4]"`
- **H2/H3 Hierarchy (2026 AI-optimized)**:
  - Use H2s for tool categories (e.g., "Health Calculators," "Financial Tools")
  - Use H3s for specific sub-tools or individual questions
  - **Favor question-based headings** to appear in AI search summaries:
    - `"How do I convert kg to lbs?"` instead of `"Kg to Lbs Conversion"`
    - `"What is 100°F in Celsius?"` instead of `"Temperature Formula"`
- **How-To Sections**: Add a section AFTER the converter widget and BEFORE the blog cross-links:
  ```html
  <div class="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Convert [X] to [Y]</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">[Formula explanation in plain English]</p>
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Common [Type] Conversions</h3>
    <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
      [5-6 common conversion examples]
    </div>
  </div>
  ```

### Category: `alt-tags`
- **2026 Standard**: Aim for 60–90 characters per alt tag
- Replace empty or generic alt text (e.g., "calculator icon") with descriptive, contextual descriptions
- Example: `"Illustration of a digital loan calculator for instant interest results"`
- Leave decorative images (with `aria-hidden="true"`) as-is
- Consider what a screen reader user would need to understand the image's purpose

### Category: `structured-data`
- Add FAQ JSON-LD schema to each converter page's `<head>` via the Layout or inline
- Include 2-3 common questions per converter (e.g., "How many kg in a pound?")
- Format:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How many pounds in a kilogram?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "1 kilogram equals approximately 2.205 pounds."
        }
      }
    ]
  }
  ```

3. **Mark completed** — After each task is implemented, update its status:
   ```sql
   UPDATE SEOImprovements SET status = 'completed', completed_at = datetime('now') WHERE id = ?;
   ```

4. **Build & verify** — Run `npm run build` to confirm no errors.

5. **Log to AuditLog** — Log the result per the audit log steering.

---

## Re-Runnability

This command is **idempotent and re-runnable**. Each run:
1. Only processes tasks with `status = 'pending'` — completed tasks are skipped
2. New tasks can be added at any time and will be picked up on the next run
3. If a page already has the improvement (e.g., FAQ schema already exists), skip it and mark completed

### Adding New Tasks

Insert new rows into the `SEOImprovements` table to queue them for the next run:

```sql
INSERT INTO SEOImprovements (task, category, priority, status, pages_affected, details)
VALUES (
  'Task description',           -- What to do
  'category-name',              -- One of: title-tags, headers, alt-tags, structured-data, meta-descriptions, internal-links
  'high',                       -- Priority: high, medium, low
  'pending',                    -- Always start as pending
  '/convert/weight,/convert/length', -- Comma-separated page paths
  'Detailed description'        -- Extra context for implementation
);
```

**Valid categories**: `title-tags`, `headers`, `alt-tags`, `structured-data`, `meta-descriptions`, `internal-links`

### Table Schema (for reference)

```sql
CREATE TABLE IF NOT EXISTS SEOImprovements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  pages_affected TEXT DEFAULT '',
  details TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT DEFAULT NULL
);
```

### Status Lifecycle

`pending` → `completed` (or `skipped` if already done)

---

## 2026 SEO & AEO Improvements (June 2026)

These are specific high-impact improvements identified for xConvert24.com based on 2026 SEO best practices, AI Answer Engine Optimization, and the site's "no sign-up" value proposition.

### Improvement 1: Homepage H1 — Front-Load "Free Online"

**Current:** `34+ Instant Converters & Calculators — Free Online`
**Target:** `Free Online Converters & Calculators — 34+ Tools, No Sign-Up`

**Rationale:** Front-loads "Free Online" (the primary search intent phrase), keeps the number authority, and moves the "No Sign-Up" differentiator from the badge into the H1 itself — where it counts for ranking.

**File:** `src/pages/index.astro`

### Improvement 2: Per-Tool Page H1s — Add "Free" / "Instant" Where Missing

Add frictionless value-prop words to tool page H1s that don't already have them:

| Page | Current H1 | Target H1 |
|------|-----------|-----------|
| `/tools/bmi` | `BMI Calculator — Body Mass Index` | `Free BMI Calculator — Instant Body Mass Index Results` |
| `/convert/temperature` | `Temperature Converter — Celsius, Fahrenheit, Kelvin` | `Celsius to Fahrenheit Converter — Free & Instant` |

**Rule:** Every tool/converter H1 should contain at least one of: "Free", "Instant", "No Sign-Up". This reduces click-anxiety and improves 2026 conversion signals.

### Improvement 3: Question-Based H2s for AEO / Featured Snippets

Add question-format H2 subheadings inside the `<!-- SEO Content -->` sections of each converter/tool page. These directly target AI Overview snippets and featured snippets.

**Pattern:**
```html
<h2>How to Calculate BMI Without Signing Up</h2>
<h2>Celsius to Fahrenheit Formula Explained</h2>
<h2>Why Use a Free Online Unit Converter?</h2>
```

**Rules:**
- Use natural-language questions users actually ask
- Place them AFTER the converter widget, BEFORE blog cross-links
- Keep answers concise (2-3 sentences) — optimized for AI extraction
- Don't duplicate existing H2s on the page

### Improvement 4: Meta Description Audit via Admin SEO Editor

Use the existing D1-backed `meta` table + `/admin/seo` editor to systematically ensure:

1. Every tool page description **starts with the primary keyword**
2. Every description includes "No sign-up" or "Free"
3. Descriptions stay **under 155 characters** (mobile truncation threshold)
4. Format: `"Free [Tool Name]. [What it does] — no sign-up required."`

**Examples:**
- BMI: `"Free BMI Calculator. Enter height & weight for instant results with WHO categories. No sign-up required."`
- Temperature: `"Free Temperature Converter. Instantly convert Celsius, Fahrenheit & Kelvin. No sign-up needed."`

### Improvement 5: Alt Text — Descriptive & Keyword-Aligned

The Product Hunt badge alt text was already updated to: `"xConvert24.com featured on Product Hunt — free online converter tools"`

Apply the same principle across all images:
- Front-load with descriptive context + primary keyword
- Target 60–90 characters
- Don't keyword-stuff — describe what the user would see/need

### What NOT to Change

- **JSON-LD structure** — WebSite + WebApplication + BreadcrumbList is already solid
- **Hero section performance** — Tailwind badge + H1 + paragraph is lean; no heavy above-fold images
- **One H1 per page rule** — Already correctly implemented across all pages
- **Homepage category cards** — Don't add per-tool H1s on the homepage

---

## Important Notes

- Process tasks in priority order: high → medium → low
- Do NOT touch pages outside the `pages_affected` list for each task
- Keep existing meta descriptions — only modify title, H1, headers, and add new sections
- The `| xConvert24.com` brand suffix is added automatically by Layout.astro — titles should NOT include it
- Run build after all changes to verify nothing breaks
- If no pending tasks exist, report "All SEO improvements are up to date" and exit
