# SEO Index Tracker — Deployment Package

Track Google Search Console indexing status for all pages. Records which URLs are indexed, discovered, not indexed, excluded, or erroring.

## Files

| File | Destination |
|------|-------------|
| `migration.sql` | `migrations/NNNN_seo_index_table.sql` |
| `api-seo-index.ts` | `src/pages/api/seo-index.ts` |
| `admin-seo.astro` | `src/pages/admin/seo.astro` |
| `admin-dashboard-tile.html` | Paste into `src/pages/admin/index.astro` grid |
| `admin-dashboard-script.js` | Append to admin dashboard `<script>` block |

## Features

- **Summary cards**: Indexed (green), Discovered (amber), Not Indexed (red), Excluded (gray), Total (purple)
- **Filterable table**: Filter by status dropdown, search by URL
- **Add/Edit modal**: Manual CRUD for individual entries
- **New Updates button**: Paste raw Search Console text + select status category → bulk upsert
- **Sync Sitemap.xml button**: Fetches sitemap, adds all URLs as "discovered" (preserves existing statuses)
- **Clickable stats on dashboard tile**: Each number links to `/admin/seo?status=X` pre-filtered
- **Timestamps in notes**: Auto-appended on sync and bulk update operations

## Database

```sql
CREATE TABLE IF NOT EXISTS seo_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'indexed',
  last_crawled TEXT DEFAULT NULL,
  first_indexed TEXT DEFAULT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## API Endpoints

- `GET /api/seo-index?status=X&search=Y` — list entries with optional filters
- `POST /api/seo-index` — upsert entry (`force_status: true` to override existing status)
- `PUT /api/seo-index` — update by id
- `DELETE /api/seo-index?id=X` — delete by id

## Customization When Porting

1. Update `import { env } from 'cloudflare:workers'` DB binding name if different
2. Update nav links in admin-seo.astro to match destination admin
3. Update sitemap URL in sync handler (`scrabblewordsfinder.com` → destination domain)
4. Update URL regex in "New Updates" parser to match destination domain
5. Add tile to admin dashboard with stats script
6. Run migration on all environments (dev, staging, live)

## Dependencies

- D1 database with the `seo_index` table
- Sitemap at `/sitemap.xml` for sync feature
- Admin auth middleware protecting `/admin/*`

## Changelog

| Date | Change |
|------|--------|
| 2026-06-15 | Initial package: table, API, admin page, sync, bulk update, dashboard tile |
