---
inclusion: manual
---

# Full Throttle — Complete Deploy Pipeline

When the user says **"full throttle"**, execute the following steps in order. Stop immediately if any step fails and report the failure.

## Steps

1. **Increment version** — Bump the minor version in `package.json` (e.g. 1.15.0 → 1.16.0). Reset patch to 0.

2. **Update release log** — Add a new entry to `src/pages/releases.astro` with the new version number, today's date, and a summary of changes since the last release (check recent git commits).

3. **Commit & push to git** — Stage all changes, commit with message `v{new_version} — {short summary}`, push to current branch.

4. **Run tests** — Execute `npx playwright test`. If tests fail, set site status to red (`POST /api/site-status` with `{ "status": "red", "updated_by": "full-throttle" }`) and STOP.

5. **Deploy to staging** — Run `npm run deploy:staging`. Emit `deployment_start` event (`POST /api/events` with `{ "type": "deployment_start" }`).

6. **Post-staging verification** — Run `npx playwright test` against staging (if staging test config exists). If tests fail, set site status to red and STOP.

7. **Set site status to green** — `POST /api/site-status` with `{ "status": "green", "updated_by": "full-throttle" }`.

8. **Deploy to production** — Run `npm run deploy`. This builds and deploys to the live Cloudflare Worker.

9. **Post-production verification** — Run tests against production. If tests fail, set site status to red and STOP.

10. **Set site status to golden** — `POST /api/site-status` with `{ "status": "golden", "updated_by": "full-throttle" }`. Emit `deployment_done` event (`POST /api/events` with `{ "type": "deployment_done" }`).

11. **Backup to GitHub** — Push the latest build/commit to the GitHub backup remote (the pipeline already does this via `scripts/deploy-staging.sh` pattern — ensure it runs or manually push).

## Important Notes

- This is a HIGH-RISK operation affecting production. Always confirm with the user before step 8 (prod deploy) unless they explicitly said "full throttle" which is blanket approval.
- The pipeline gate hooks (CI checks, SonarQube) still apply — honour them.
- If any step fails, report which step failed and what the error was.
- The version source of truth is `package.json` → re-exported via `src/data/siteStats.ts`.
