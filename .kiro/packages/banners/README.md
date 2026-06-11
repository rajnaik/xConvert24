# Banner Rotation — Deployment Package

Self-contained package for deploying the banner rotation feature to any Astro + Cloudflare D1 workspace.

## Package Contents

| File | Purpose |
|------|---------|
| `migration-banners.sql` | Creates `banners` table + seeds 10 rows |
| `migration-banner-clicks.sql` | Creates `banner_clicks` table + indexes |
| `api-banners.ts` | GET/PUT /api/banners — manage rotation pool |
| `api-banner-click.ts` | POST /api/banner-click — track clicks |
| `admin-banner-management.astro` | Admin toggle UI (copy to `src/pages/admin/`) |
| `consumer-script.ts` | Client-side banner loader (embed in homepage/layout) |
| `tests-banner-management.spec.ts` | Playwright tests |

## Deployment Steps

1. Copy `migration-banners.sql` to destination `migrations/` folder (use next number)
2. Copy `migration-banner-clicks.sql` to destination `migrations/` folder
3. Copy `api-banners.ts` to `src/pages/api/banners.ts`
4. Copy `api-banner-click.ts` to `src/pages/api/banner-click.ts`
5. Copy `admin-banner-management.astro` to `src/pages/admin/banner-management.astro`
6. Embed `consumer-script.ts` content into homepage/layout `<script>` tag
7. Run migrations against all environments
8. Create/place banner SVGs in `public/banner-options/`
9. Copy tests to `tests/`

## Customization Required

- **D1 binding name**: Replace `DB` with your binding (e.g., `BUGS_DB` for xConvert)
- **Nav links**: Update admin navigation to match destination site
- **Site name**: Replace "ScrabbleWordsFinder" with destination brand
- **Banner count**: Default is 10, adjust seed data and UI cards as needed
- **Banner SVGs**: Must be created separately for each destination site

## Created

Date: 2026-06-10
Source: ScrabbleWordsFinder.com (SWF)
