---
inclusion: always
---

# Environment Architecture

xConvert24 runs across three fully isolated environments. Each has its own database, KV store, and Worker.

## Environments

| Environment | Command | D1 (Main) | D1 (Blogs) | KV (Session) | URL |
|-------------|---------|-----------|------------|--------------|-----|
| **Dev** | `npm run dev` | xconvert24-dev (13d84b09) | xconvert24-dev-blogs (fe875b06) | 31964ba2 | localhost:4321 |
| **Staging** | `npm run deploy:staging` | xconvert24-staging (e28a7b2a) | xconvert24-staging-blogs (ddb48550) | 53bce1b2 | staging.xconvert24.com |
| **Live** | `npm run deploy` | xconvert24-bugs (433762c6) | xconvert24-blogs (e91bf544) | f542b19f | xconvert24.com |

## Rules

1. **`npm run dev` always connects to the dev database** via `--remote` flag. No local-only mode.
2. All three environments have the same schema (all migrations applied).
3. Never connect dev to the live database.
4. Deploy pipeline: Dev → Staging (test) → Live (golden).
5. Config files: `wrangler.jsonc` (live), `wrangler.staging.jsonc` (staging), `wrangler.dev.jsonc` (dev).

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
