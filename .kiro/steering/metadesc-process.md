---
inclusion: manual
---

# Metadesc Process — Meta Description Creation for New Converters

When the user says **Metadesc**, run the following process:

## Steps

1. **Find newly created converter pages**: Query the `ConvertorsInPipeline` table for records with `status = 2` (page created) that don't yet have a meta description in the `meta` table.
2. **Identify page URLs**: Map each created converter to its URL path (e.g., `precious-metals.astro` → `/convert/precious-metals/`).
3. **Write SEO meta descriptions** following these rules:
   - 150–160 characters max (Google truncates beyond this)
   - Start with an action verb or benefit statement
   - Include the primary keyword naturally
   - Include a unique selling point (free, accurate, no sign-up)
   - End with a call-to-action or value prop
   - Match the style of existing descriptions on the site
4. **Insert into the `meta` table** in all 3 environments (dev, staging, live):
   ```sql
   INSERT INTO meta (url, meta_description) VALUES ('/convert/slug/', 'description here');
   ```
5. **Update `ConvertorsInPipeline`** status to indicate meta description added (optional comment update).

## Style Guide (based on existing site descriptions)

Pattern: `[Action/Benefit]. [What it does]. [USP]. [CTA/promise].`

Examples from existing pages:
- "Free Weight & Mass Converter. Convert kilograms to pounds, grams to ounces, and more instantly. Free, accurate, and easy to use. No sign-up required."
- "Fast Length & Distance Converter. Quickly convert inches to cm, miles to km, and feet to meters. Free, 100% accurate, and no sign-up hassle. Try it today!"
- "Free Volume Converter. Convert litres to gallons, cups to mL, and more instantly. 100% accurate results with no ads or sign-up."

Key principles:
- Lead with "Free" or "Fast" 
- Mention 2-3 specific conversion pairs
- End with trust signal (free, accurate, no sign-up, no ads)
- Keep under 160 chars

## Database Schema

```sql
CREATE TABLE meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  meta_description TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## How It Works at Runtime

The `Layout.astro` component fetches from the `meta` table at runtime:
```typescript
const row = await db.prepare('SELECT meta_description FROM meta WHERE url = ?').bind(pagePath).first();
if (row && row.meta_description) {
  description = row.meta_description;
}
```

This overrides the hardcoded `description` prop passed to `<Layout>`. If no DB row exists, the prop value is used as fallback.

## Commands

```bash
# Insert meta description (all 3 envs)
npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT INTO meta (url, meta_description) VALUES ('/convert/slug/', 'description');"
npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc --command "INSERT INTO meta (url, meta_description) VALUES ('/convert/slug/', 'description');"
npx wrangler d1 execute BUGS_DB --remote --config wrangler.staging.jsonc --command "INSERT INTO meta (url, meta_description) VALUES ('/convert/slug/', 'description');"
```
