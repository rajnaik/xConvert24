# Full Deploy — Everything Ships Together

## Rule

When Raj says **"deploy"**, **"deploy to staging"**, **"deploy to live"**, **"Ship It"**, or **"Full Throttle"**, it means deploy EVERYTHING — not just the code. The full deploy includes:

1. **Code** — `astro build` + `wrangler deploy` (or `deploy:staging`)
2. **Database migrations** — apply any pending migrations to the target environment
3. **Database seeds** — if new data was seeded locally (WOTD, anagrams, racks, blog_ideas, etc.), push it to the target
4. **Configs** — any wrangler.jsonc changes are already picked up by deploy, but verify bindings are correct
5. **KV data** — if any KV values were set locally, push to target environment
6. **Secrets** — if new secrets were added, remind Raj to set them on the target (never auto-push secrets)

## Deploy Checklist (execute in order)

### Staging (`deploy to staging`)
```bash
cd <workspace>
# 1. Kill dev server (required for build)
kill $(lsof -ti:<PORT>) 2>/dev/null
# 2. Build
npx astro build
# 3. Apply pending migrations
npx wrangler d1 migrations apply <DB_BINDING> --remote --config wrangler.staging.jsonc
# 4. Deploy code
npx wrangler deploy --config wrangler.staging.jsonc
# 5. Restart dev server
npm run dev
```

### Live (`Ship It` / `Full Throttle` / `deploy to live`)
```bash
cd <workspace>
# 1. Kill dev server
kill $(lsof -ti:<PORT>) 2>/dev/null
# 2. Build
npx astro build
# 3. Apply pending migrations
npx wrangler d1 migrations apply <DB_BINDING> --remote
# 4. Deploy code
npx wrangler deploy
# 5. Restart dev server
npm run dev
```

## Workspace-Specific Bindings

| Workspace | DB Binding | Staging Config | Port |
|-----------|-----------|----------------|------|
| SWF | `DB` | `wrangler.staging.jsonc` | 4321 |
| xConvert | `BUGS_DB` | `wrangler.staging.jsonc` | 4322 |
| Coins | `DB` | `wrangler.staging.jsonc` | 4323 |
| Playground | `DB` | `wrangler.staging.jsonc` | 4324 |

## What "Everything" Means

- If there are un-applied migrations in the `migrations/` folder → apply them
- If local DB has data not on the target (new seeds) → push the SQL
- If new API endpoints were created → they deploy with the code
- If wrangler.jsonc was modified (new bindings, routes) → it deploys with the code
- If new secrets are needed → warn Raj (never auto-set secrets)

## What NOT to Do

- Never deploy code without building first
- Never skip migrations (they're part of the deploy)
- Never deploy to live without Raj's explicit approval (per deploy-approval rule)
- Never push secrets automatically

## Agent Attribution

This is a **kiro** steering rule, created June 28, 2026.
