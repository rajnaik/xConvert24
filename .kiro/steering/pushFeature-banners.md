# pushFeature [source] [destination] banners — Port Banner Rotation Between Workspaces

When the user says "pushFeature [source] [destination] banners", replicate the banner rotation system from the source workspace to the destination workspace.

Example invocations:
- `pushFeature swf xconvert banners` — port from SWF → xConvert24
- `pushFeature xconvert swf banners` — port from xConvert24 → SWF

## Syntax

```
pushFeature <source_workspace> <destination_workspace> <feature_name>
```

- **source**: The workspace to read/copy from (read-only during execution)
- **destination**: The workspace to write to (must match active Dev Mode)
- **feature_name**: The feature being ported (here: `banners`)

## Prerequisites

- Dev Mode must match the **destination** workspace before executing
- Source workspace is read-only (used as reference only)

## Workspace Paths

| Workspace ID | Root Path |
|-------------|-----------|
| `swf` | `/Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/` |
| `xconvert` | `/Users/rajeevnaik/Code/xConvert.com/` (excluding `scrabblewordsfinder/`) |

## Reference Files (Source — read-only)

When source is `swf`:

| Component | Path |
|-----------|------|
| Migration | `scrabblewordsfinder/migrations/0012_banners_table.sql` |
| API endpoint | `scrabblewordsfinder/src/pages/api/banners.ts` |
| Admin UI | `scrabblewordsfinder/src/pages/admin/banner-management.astro` |
| Homepage consumer | `scrabblewordsfinder/src/pages/index.astro` (banner loading script) |
| Blog consumer | `scrabblewordsfinder/src/layouts/BlogLayout.astro` (banner loading script) |
| Click tracking | `scrabblewordsfinder/src/pages/api/banner-click.ts` |
| Playwright tests | `scrabblewordsfinder/tests/admin-banner-management.spec.ts` |

## Steps

### 1. Create Migration

Create `migrations/NNNN_banners_table.sql` (use next available number in destination) with:

```sql
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Seed with destination-specific banner options. Include ad-words in descriptions (per swf-brand-keywords pattern).

### 2. Create API Endpoint

Create `src/pages/api/banners.ts` in destination with:
- `GET /api/banners` — returns all banners (or `?active=true` for rotation pool only)
- `PUT /api/banners` — toggle `{ option_number, status }` → updates DB, returns updated banner + active_count

Use the correct D1 binding name for the destination:
- xConvert: `BUGS_DB`
- SWF: `DB`

### 3. Create Admin Page

Create `src/pages/admin/banner-management.astro` in destination:
- Toggle switches (not buttons) for each banner
- Rotation pool summary with active count
- Toast notification on success
- Error banner with auto-revert on failure
- Match destination's admin styling (read existing admin pages for nav pattern)

### 4. Wire Homepage Banner Rotation

Add client-side script to homepage/layout in destination:
```ts
(async function loadBanner() {
  const res = await fetch('/api/banners?active=true');
  if (res.ok) {
    const { banners } = await res.json();
    if (banners.length > 0) {
      const picked = banners[Math.floor(Math.random() * banners.length)];
      // Set hero banner image src
    }
  }
})();
```

### 5. Apply Migration to All Destination Environments

For xConvert destination:
```bash
npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc --command "CREATE TABLE IF NOT EXISTS banners ..."
npx wrangler d1 execute BUGS_DB --remote --config wrangler.staging.jsonc --command "CREATE TABLE IF NOT EXISTS banners ..."
npx wrangler d1 execute xconvert24-bugs --remote --command "CREATE TABLE IF NOT EXISTS banners ..."
```

For SWF destination:
```bash
cd scrabblewordsfinder
npx wrangler d1 execute DB --remote --command "CREATE TABLE IF NOT EXISTS banners ..."
npx wrangler d1 execute DB --remote --config wrangler.staging.jsonc --command "CREATE TABLE IF NOT EXISTS banners ..."
```

### 6. Create Banner Assets

Place banner SVGs in destination's `public/banner-options/banner-1.svg` through `banner-N.svg`.
- Design new banners for the destination site, or ask the user what banners to create.

### 7. Add Playwright Tests

Create a test file in destination's `tests/` covering:
- Page structure (title, nav, cards, toggles)
- Toggle behaviour (API calls, card styling)
- Rotation summary (active count updates)
- Error handling (revert on failure)
- Toast notifications

### 8. Optional: Banner Click Tracking

Create `src/pages/api/banner-click.ts` in destination:
- `POST /api/banner-click` — logs `{ banner_id, page_url, ip_address, referrer }`

## Post-Execution

- Log to AuditLog: `command: "pushFeature [src] [dest] banners", status: 1, details: "Ported banner rotation from [src] to [dest]"`
- Log to org_tasks: `agent_id: "kiro", task: "pushFeature banners: Ported from [src] to [dest]"`

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
