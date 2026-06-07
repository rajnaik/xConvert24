---
inclusion: manual
---

# CHOP Process — Blog Pipeline Processing

**IMPORTANT: When the user says CHOPX, delegate the entire process to a sub-agent (`general-task-execution`) so the main conversation remains free for planning.**

When the user says **CHOPX** (e.g., CHOP5, CHOP3, CHOP9), run the following process on the first X records from `BlogsInPipeline` where `status = 1` (unprocessed):

## Steps (per record)

1. **Fetch** the first X unprocessed rows: `SELECT * FROM BlogsInPipeline WHERE status = 1 ORDER BY BlogID LIMIT X`
2. **Compare** each pipeline blog name against:
   - The `Blogs` table (existing published blogs by topic)
   - The actual page files in `src/pages/blog/*.astro`
   - Check for similar/overlapping topics (e.g., "What Is Bitcoin?" overlaps with "understanding-cryptocurrency-basics.astro")
3. **If DUPE** (the blog topic is already covered by an existing page):
   - `UPDATE BlogsInPipeline SET comment = 'Dupe - covered by [existing-blog]', status = 10 WHERE BlogID = ?`
4. **If NEW** (no match found):
   - Identify which category it belongs to (Crypto, Finance, Health, Conversions, etc.)
   - Create a new `.astro` page at `src/pages/blog/<slug>.astro` following the existing blog page pattern
   - Add an orange "NEW" badge/icon to the page header
   - Add the blog to any relevant listing pages or menus with an orange NEW badge
   - After successful page creation, update: `UPDATE BlogsInPipeline SET comment = 'Page created - <slug>.astro', status = 2 WHERE BlogID = ?`
   - Insert a meta description in the `meta` table across all 3 environments
5. **Move to next record** and repeat until all X are processed.

## Matching Rules

A pipeline blog is a **dupe** if:
- Its topic is already covered by an existing blog page (exact or very similar title/content)
- The subject matter substantially overlaps with an existing post

A pipeline blog is **new** if:
- No existing blog page covers that specific topic
- It represents a genuinely distinct article

## Database Schema

```sql
-- BlogsInPipeline
CREATE TABLE BlogsInPipeline (
  BlogID INTEGER PRIMARY KEY AUTOINCREMENT,
  BlogName TEXT NOT NULL,
  BlogBody TEXT,
  DateCreated TEXT DEFAULT (datetime('now')),
  DatePublished TEXT,
  ViewCounter INTEGER DEFAULT 0,
  comment TEXT,
  status INTEGER DEFAULT 1
);

-- Blogs (existing published)
CREATE TABLE Blogs (
  blogid TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  description TEXT DEFAULT '',
  pub_date TEXT DEFAULT '',
  create_date TEXT DEFAULT (datetime('now')),
  status INTEGER DEFAULT 0
);
```

## Existing Blog Pages (for reference)

Located at `src/pages/blog/*.astro`. Key existing topics include:
- understanding-cryptocurrency-basics
- gold-weight-troy-ounces
- compound-interest-explained
- how-exchange-rates-work
- Various conversion guides (celsius, kg, miles, etc.)

## Blog Page Template Pattern

Follow existing blog pages (e.g., `understanding-cryptocurrency-basics.astro`):
- `export const prerender = true;`
- Import Layout and BlogCrossLinks
- Breadcrumb nav
- Article with prose styling
- Orange NEW badge in header
- SEO-optimized title and description
- ~800-1200 words of useful content
- Internal links to relevant converters/tools

## Orange NEW Icon

Use this inline in the blog header:
```html
<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ml-2">NEW</span>
```

## Database Commands

```bash
# Query unprocessed pipeline items
npx wrangler d1 execute xconvert24-bugs --remote --command "SELECT * FROM BlogsInPipeline WHERE status = 1 ORDER BY BlogID LIMIT X;" --json

# Mark as dupe
npx wrangler d1 execute xconvert24-bugs --remote --command "UPDATE BlogsInPipeline SET comment = 'Dupe', status = 10 WHERE BlogID = X;"

# Mark as created
npx wrangler d1 execute xconvert24-bugs --remote --command "UPDATE BlogsInPipeline SET comment = 'Page created', status = 2 WHERE BlogID = X;"

# Meta description (all 3 envs)
npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT INTO meta (url, meta_description) VALUES ('/blog/slug/', 'description');"
npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc --command "INSERT INTO meta (url, meta_description) VALUES ('/blog/slug/', 'description');"
npx wrangler d1 execute BUGS_DB --remote --config wrangler.staging.jsonc --command "INSERT INTO meta (url, meta_description) VALUES ('/blog/slug/', 'description');"
```
