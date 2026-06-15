# Ports — SWF Features to Port to xConvert24

Features built on SWF that should be replicated on xConvert24.

## Ready to Port (packages exist)

| # | Feature | Package Location | Effort |
|---|---------|-----------------|--------|
| 1 | **Banner Rotation** | `.kiro/packages/banners/` | 2h |
| 2 | **Telemetry** | `.kiro/packages/telemetry/` | 30min |
| 3 | **SEO Index Tracker** | `.kiro/packages/seo-index/` | 45min |

## Need Packaging First

| # | Feature | SWF Source | Effort |
|---|---------|-----------|--------|
| 3 | **Click Tracking (full)** | `src/pages/api/clicks.ts` + `src/scripts/click-tracker.ts` | 1h |
| 4 | **Cookie Consent** | `src/components/CookieConsent.astro` | 30min |
| 5 | **Email Service (contact/suggest)** | `src/pages/api/contact.ts`, `src/pages/api/suggest.ts` | 1h |
| 6 | **Admin Emails CRUD** | `src/pages/admin/emails.astro`, `src/pages/api/emails.ts` | 1h |
| 7 | **Admin Clicks Dashboard** | `src/pages/admin/clicks.astro` | 30min |
| 8 | **Google OAuth Admin Auth** | `src/middleware.ts`, `src/pages/api/auth/` | 1h |
| 9 | **Release Train** | `src/pages/admin/release-train.astro` | 30min |
| 10 | **Testing Environments Page** | `src/pages/admin/environments.astro` | 15min |
| 11 | **Sanitise Command** | `.kiro/steering/sanitise-swf.md` (adapt for xconvert) | 15min |
| 12 | **Footer Click Counter** | In Layout.astro | 15min |
| 13 | **Sound Alerts on Clicks** | `public/media/*.wav` + clicks.astro | 15min |

## Already on xConvert (no port needed)

- Site Status widget
- Logo management
- Ops console
- Click tracking (basic version exists)
- AuditLog

## Priority Order for Porting

1. Cookie Consent (#4) — GDPR/privacy requirement
2. Google OAuth (#8) — secure admin
3. Click Tracking full (#3) — enriched data
4. Email Service (#5) — contact forms
5. Telemetry (#2) — health monitoring
6. Banner Rotation (#1) — if xConvert wants banners

## How to Port

Say: `pushFeature <source> <destination> <feature>`
Example: `pushFeature swf xconvert telemetry`


## Additional Features to Port

| # | Feature | SWF Source | Effort | Notes |
|---|---------|-----------|--------|-------|
| 14 | **Emails Table + Admin CRUD** | `migrations/emails`, `api/emails.ts`, `admin/emails.astro` | 1h | View/edit/delete all contact+suggest submissions |
| 15 | **Write to emails table on contact/suggest** | `api/contact.ts`, `api/suggest.ts` | 30min | Every form submission saved to DB |
| 16 | **Social Card (og:image)** | `public/social-card.svg` + Layout meta tags | 15min | Branded preview for social sharing |
| 17 | **Admin noindex** | Layout.astro conditional meta | 5min | Prevent admin pages from being indexed |
| 18 | **Sanitise automated tests** | `tests/sanitise.spec.ts` | 30min | Checks for sensitive data, policy violations |
| 19 | **E2E Email verification** | `test_emails` table + test pattern | 30min | Full loop email delivery testing |
| 20 | **Post-deploy hooks** | `.kiro/hooks/post-build-sanitise` | 10min | Auto-run sanitise after every deploy |
| 21 | **Data management (privacy page)** | Privacy page sections | 30min | Anonymous tracking disclosure, cookie opt-out impact |
| 22 | **Live click counter in footer** | Layout footer + `/api/clicks?count=true` | 15min | Shows total interactions, polls every 2s |
| 23 | **Banner click tracking** | `api/banner-click.ts` + `banner_clicks` table | 30min | Track which banners get clicked |
| 24 | **Click sound alerts (admin)** | `public/media/*.wav` + admin clicks page | 15min | Audible notification on new clicks |
| 25 | **Auto-save click tracker** | Inline script in Layout | 15min | Every click tracked with 20 fields (geo, device, session) |
| 26 | **SEO FAQ schema on every page** | JSON-LD in each page | 2h | 3+ Q&A per page for rich snippets |
| 27 | **Telemetry history (DB-backed)** | `telemetry` table + API history endpoint | 30min | Stores response time history |
| 29 | **Click Analysis Bubble Chart** | `src/pages/admin/clicks-analysis.astro` | 1h | Visual bubble chart of clicks by element/page/country/device/browser with rich tooltips |
| 28 | **Testing environments page** | `admin/environments.astro` | 15min | Shows dev/staging/live URLs + status |
