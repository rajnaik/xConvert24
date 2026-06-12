# Create Workspace X xname — Bootstrap a New Workspace

When the user says "create workspace <abbrev> <displayName>", scaffold a new workspace with all standard infrastructure.

## Syntax

```
create workspace <abbrev> <displayName>
```

Example: `create workspace blog BlogSite` creates a workspace with short name `blog` and display name `BlogSite`.

## Steps

### 1. Create Project Folder
```bash
mkdir -p /Users/rajeevnaik/Code/xConvert.com/<abbrev>
cd /Users/rajeevnaik/Code/xConvert.com/<abbrev>
```

### 2. Initialize Astro + Cloudflare
```bash
npm create astro@latest . -- --template minimal
npx astro add cloudflare tailwind
```

### 3. Create Wrangler Configs
- `wrangler.jsonc` (live)
- `wrangler.staging.jsonc` (staging)

### 4. Create Standard Database Tables
```sql
-- emails table (per emailGuide)
CREATE TABLE emails (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT NOT NULL DEFAULT 'contact', name TEXT DEFAULT '', email TEXT DEFAULT '', subject TEXT DEFAULT '', message TEXT DEFAULT '', ip_address TEXT DEFAULT '', comment TEXT DEFAULT '', read INTEGER NOT NULL DEFAULT 0, actioned INTEGER NOT NULL DEFAULT 0, date_actioned TEXT DEFAULT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));

-- clicks table (per click tracking)
CREATE TABLE clicks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, ui_element TEXT, url TEXT, ip_address TEXT, country TEXT DEFAULT '', city TEXT DEFAULT '', region TEXT DEFAULT '', user_agent TEXT DEFAULT '', referrer TEXT DEFAULT '', device_type TEXT DEFAULT '', browser TEXT DEFAULT '', os TEXT DEFAULT '', language TEXT DEFAULT '', session_id TEXT DEFAULT '', screen_width INTEGER, screen_height INTEGER, viewport_width INTEGER, viewport_height INTEGER, click_x INTEGER, click_y INTEGER, page_title TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')));

-- telemetry table
CREATE TABLE telemetry (id INTEGER PRIMARY KEY AUTOINCREMENT, endpoint_name TEXT NOT NULL, path TEXT NOT NULL, status_code INTEGER NOT NULL, response_ms INTEGER NOT NULL, healthy INTEGER NOT NULL DEFAULT 1, checked_at TEXT NOT NULL DEFAULT (datetime('now')));

-- site_status table
CREATE TABLE site_status (id INTEGER PRIMARY KEY AUTOINCREMENT, status TEXT NOT NULL DEFAULT 'green', logo_option INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT (datetime('now')), updated_by TEXT DEFAULT 'system');

-- test_results table
CREATE TABLE test_results (id INTEGER PRIMARY KEY AUTOINCREMENT, test_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', run_at TEXT DEFAULT (datetime('now')), file_changed TEXT DEFAULT '', error_message TEXT DEFAULT '');
```

### 5. Copy Standard Files From Packages
- Cookie Consent: `.kiro/packages/` → `src/components/CookieConsent.astro`
- Click Tracker: inline script in Layout
- Telemetry API: `.kiro/packages/telemetry/`
- Email API: contact.ts, suggest.ts, emails.ts

### 6. Create Standard Pages
- `src/pages/index.astro` — homepage
- `src/pages/about.astro`
- `src/pages/privacy.astro` — with anonymous tracking disclosure
- `src/pages/contact.astro`
- `src/pages/suggest.astro`
- `src/pages/terms.astro`
- `src/pages/disclaimer.astro`
- `src/pages/admin/index.astro` — admin dashboard
- `src/pages/admin/emails.astro`
- `src/pages/admin/clicks.astro`
- `src/pages/admin/telemetry.astro`
- `src/pages/admin/environments.astro`
- `src/pages/api/clicks.ts`
- `src/pages/api/contact.ts`
- `src/pages/api/suggest.ts`
- `src/pages/api/emails.ts`
- `src/pages/api/telemetry.ts`
- `src/pages/api/site-status.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/callback.ts`
- `src/pages/api/auth/logout.ts`

### 7. Create Layout with Standard Features
- Responsive header
- Footer with links + click counter
- Cookie consent component
- Click tracker (inline, skips /admin)
- Meta tags (title, description, og:image, canonical)
- Admin noindex conditional
- Logo + banner rotation script

### 8. Create Middleware (Google OAuth)
- `src/middleware.ts` — protects /admin/* routes
- Allowed emails: raj007@gmail.com, xconvert24@gmail.com

### 9. Set Up Secrets
```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put <ABBREV>_NOTIFY_EMAIL
```

### 10. Create Standard Tests
- `tests/sanitise.spec.ts`
- `tests/email-features.spec.ts`
- `tests/playwright.config.ts`

### 11. Update Dev Mode Lock
Add to `.kiro/steering/dev-mode-lock.md`:
```
| `Dev Mode <abbrev>` | <displayName> | `/Users/rajeevnaik/Code/xConvert.com/<abbrev>/` | <displayName> files only |
```

### 12. Create sitemap.xml + robots.txt

### 13. Social card (og:image)

### 14. Initial Deploy
```bash
npx astro build && npx wrangler deploy
```

### 15. Register with Search Engines
- Google Search Console
- Bing Webmaster Tools
- Submit sitemap

## Post-Creation Checklist
- [ ] Project folder created
- [ ] Astro + Cloudflare initialized
- [ ] DB tables created (all environments)
- [ ] Standard pages scaffolded
- [ ] Auth middleware in place
- [ ] Secrets set
- [ ] Tests created
- [ ] Dev Mode registered
- [ ] Deployed to live
- [ ] Sitemap submitted

## Agent Attribution
This is a **kiro** command.


## Complete Feature Inventory (SWF as Reference)

### Database Tables to Create

| Table | Purpose | Rows to Seed |
|-------|---------|-------------|
| `emails` | Contact/suggest form submissions | None |
| `clicks` | Every user interaction (20 fields) | None |
| `telemetry` | Endpoint health history | None |
| `site_status` | Site status, logo option | 1 default row |
| `banners` | Banner rotation pool | 10 banner rows |
| `banner_clicks` | Banner click tracking | None |
| `test_results` | Automated test pass/fail log | None |
| `test_emails` | E2E email verification | None |
| `tasks` | Project task management | Seed with initial tasks |
| `suggestions` | Legacy suggest table | None |
| `blog_ideas` | Blog content pipeline | Seed with ideas |

### Pages to Create

**Public Pages:**
- `/` — main tool/converter (the core product)
- `/about` — about the tool + team
- `/privacy` — privacy policy with data tracking disclosure
- `/contact` — contact form (saves to emails + sends email)
- `/suggest` — feature suggestion form
- `/terms` — terms of use
- `/disclaimer` — legal disclaimer
- `/guide` — user guide with data management section
- `/settings` — user preferences, UUID, nuke localStorage
- `/releases` — release notes/changelog
- `/blog/` — blog index
- `/blog/<posts>` — individual blog posts
- `/sitemap.xml` — auto-generated

**Admin Pages:**
- `/admin/` — dashboard with tiles for all admin features
- `/admin/emails` — email CRUD (view, edit, delete, mark read/actioned)
- `/admin/clicks` — click analytics with sound alerts + auto-refresh
- `/admin/telemetry` — live endpoint health + history
- `/admin/environments` — dev/staging/live URLs and status
- `/admin/banner-management` — toggle banners active/inactive
- `/admin/banner-clicks` — banner click analytics
- `/admin/release-train` — build release pipeline from commands
- `/admin/logo-management` — select active logo
- `/admin/ops/` — operations console
- `/admin/report/` — reports dashboard

**API Endpoints:**
- `POST /api/clicks` — log click (20 fields)
- `GET /api/clicks` — read clicks (filters, count)
- `POST /api/contact` — send contact email + save to DB
- `POST /api/suggest` — save suggestion + send notification
- `GET/PUT/DELETE /api/emails` — emails CRUD
- `GET /api/banners` — get all/active banners
- `PUT /api/banners` — toggle banner status
- `POST /api/banner-click` — log banner click
- `GET /api/banner-clicks` — read banner clicks
- `GET /api/telemetry` — live health check + save to DB
- `GET /api/telemetry?history=true` — historical data
- `GET /api/site-status` — site status + logo option
- `PUT /api/site-status` — update status
- `GET /api/tasks` — task list
- `POST /api/tasks` — create task
- `GET /api/test-emails` — check test email delivery
- `GET /api/auth/login` — Google OAuth redirect
- `GET /api/auth/callback` — OAuth callback + set session
- `GET /api/auth/logout` — clear session

### Components
- `CookieConsent.astro` — GDPR cookie banner (dark theme)

### Layouts
- `Layout.astro` — main layout (header grid, footer, click tracker, cookie consent, logo/banner rotation)
- `BlogLayout.astro` — blog-specific layout (same header, article styling)

### Infrastructure Files
- `src/middleware.ts` — Google OAuth protection for /admin/*
- `src/scripts/click-tracker.ts` — (reference, inlined in Layout)
- `public/robots.txt`
- `public/social-card.svg`
- `public/favicon.svg`
- `public/media/*.wav` — sound alerts
- `public/banner-options/banner-*.svg` — 10 banners
- `public/logo-options/option-*.svg` — 5 logos
- `tests/sanitise.spec.ts`
- `tests/email-features.spec.ts`
- `tests/playwright.config.ts`

### Hooks (shared, in .kiro/hooks/)
- `ui-test-watcher` — auto-write tests on UI file edits
- `pre-write-test-check` — check test_results before writing
- `post-build-sanitise` — sanitise scan after task execution

### The Core Product
Each workspace needs ONE main tool/feature. Examples:
- SWF: Scrabble word solver (dictionary + solver logic)
- xConvert: Unit converters (conversion formulas)
- Future: QR generator, JSON formatter, typing test, etc.

The tool goes in `src/pages/index.astro` with its logic in `<script>` tags or imported modules.
