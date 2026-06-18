# Dev-Only Testing — STRICT Rule

## Rule

During development, **ALL Playwright tests MUST run against localhost (dev server) ONLY**. Never run tests against staging or live URLs during development.

## What This Means

1. **Always use `SWF_TEST_URL=http://localhost:4321`** (or equivalent localhost URL) when running tests during development.
2. **NEVER use staging URLs** (`*-staging.xconvert.workers.dev`) during dev testing.
3. **NEVER use live URLs** (`www.scrabblewordsfinder.com`, `www.xconvert24.com`) during dev testing.
4. **The dev server MUST be running** before executing any test.

## Commands

```bash
# SWF — start dev server first, then test
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npm run dev
# In another terminal:
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && SWF_TEST_URL=http://localhost:4321 npx playwright test tests/<file>.spec.ts --reporter=list

# xConvert — same pattern
cd /Users/rajeevnaik/Code/xConvert.com && npm run dev
cd /Users/rajeevnaik/Code/xConvert.com && npx playwright test tests/<file>.spec.ts --reporter=list
```

## Why

- Staging/live may not have the latest local changes deployed
- Tests against remote URLs add network latency and flakiness
- Local testing gives instant feedback on code changes
- Avoids false negatives from undeployed code

## Exceptions

- **Post-deploy verification** (e.g., `post-deploy-email-tests`) — these explicitly test live after deployment
- **SEO health checks** — these intentionally validate live/staging URLs
- **Explicit user instruction** — if Raj says "test against staging/live", follow that directive

## Applies To

All workspaces: SWF, xConvert, Coins, Playground. All automated test runs during development.
