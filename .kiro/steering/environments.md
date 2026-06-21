---
inclusion: always
---

# Environment Architecture

xConvert24 runs across three fully isolated environments. Each has its own database, KV store, and Worker.

## Environments

| Environment | Command | D1 (Main) | D1 (Blogs) | KV (Session) | URL |
|-------------|---------|-----------|------------|--------------|-----|
| **Dev** | `npm run dev` | xconvert24-dev (13d84b09) | xconvert24-dev-blogs (fe875b06) | 31964ba2 | localhost:4322 |
| **Staging** | `npm run deploy:staging` | xconvert24-staging (e28a7b2a) | xconvert24-staging-blogs (ddb48550) | 53bce1b2 | staging.xconvert24.com |
| **Live** | `npm run deploy` | xconvert24-bugs (433762c6) | xconvert24-blogs (e91bf544) | f542b19f | xconvert24.com |

## Rules

1. **`npm run dev` uses LOCAL miniflare SQLite** — despite the `--remote` flag, the Astro dev server binds to local `.wrangler/state/v3/d1/` SQLite files. Use `wrangler d1 execute --remote` to write to the actual remote DB.
2. **To write data visible in the local dev dashboard**: POST to `http://localhost:4322/api/...` endpoints, or use `sqlite3` directly on the local miniflare files.
3. **To write data visible on staging/live**: Use `wrangler d1 execute` with `--remote`.
4. All three environments have the same schema (all migrations applied).
5. Never connect dev to the live database.
6. Deploy pipeline: Dev → Staging (test) → Live (golden).
7. Config files: `wrangler.jsonc` (live), `wrangler.staging.jsonc` (staging), `wrangler.dev.jsonc` (dev).
8. **"Analytics" on the admin dashboard always means `/admin/clicks-analysis` (our own click data), NOT `/admin/analytics` (Google Analytics).** Only the explicitly-labeled "Google Analytics" card in Tools & External should link to `/admin/analytics`.

## Database Migrations

All migrations in `/migrations/` must be applied to ALL THREE environments:
```bash
# Dev
npx wrangler d1 migrations apply BUGS_DB --remote --config wrangler.dev.jsonc

# Staging  
npx wrangler d1 migrations apply BUGS_DB --remote --config wrangler.staging.jsonc

# Live
npx wrangler d1 migrations apply xconvert24-bugs --remote
```

---

## ScrabbleWordsFinder.com (Subproject)

A separate Astro + Cloudflare Worker service living in `/scrabblewordsfinder/` with its own databases and deploy pipeline.

| Environment | Command | D1 | URL |
|-------------|---------|-----|-----|
| **Dev** | `npm run dev` (from `/scrabblewordsfinder/`) | local miniflare | localhost:4321 |
| **Staging** | `npm run deploy:staging` | scrabble-staging (be0fad12) | workers.dev |
| **Live** | `npm run deploy` | scrabble-live (e9af2a48) | scrabblewordsfinder.com |

Config files: `scrabblewordsfinder/wrangler.jsonc` (live), `scrabblewordsfinder/wrangler.staging.jsonc` (staging).

This is a fully independent service — its databases are NOT part of the main xConvert24 migration pipeline.

## Fixed Dev Ports

Each workspace has a **fixed port** configured in `astro.config.mjs` to prevent conflicts:

| Workspace | Port | URL |
|-----------|------|-----|
| **SWF** | 4321 | http://localhost:4321 |
| **xConvert** | 4322 | http://localhost:4322 |
| **Coins** | 4323 | http://localhost:4323 |
| **Playground** | 4324 | http://localhost:4324 |

If a port is already in use, Astro will fail to start rather than silently picking a new port. This prevents orphan dev servers accumulating on random ports.
