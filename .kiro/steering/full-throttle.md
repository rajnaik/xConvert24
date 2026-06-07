---
inclusion: manual
---

# Deployment Commands

Three voice commands control the deploy pipeline. Stop immediately if any step fails and report the failure.

---

## 🔥 "Fire Your Engine"

When the user says **"Fire your engine"**, execute these steps in order:

1. **Commit & push to git** — Stage all changes, commit with message `v{version} — {short summary}`, push to current branch.
2. **Build** — Run `npm run build` to verify the project compiles cleanly.
3. **Update release notes** — Add a new entry to `src/pages/releases.astro` with the current version, today's date, and a summary of changes since the last release (check recent git commits).
4. **Run tests** — Execute `npx playwright test`. If tests fail, report the failure and STOP.

---

## 🚀 "Throttle Half"

When the user says **"Throttle half"**, execute these steps in order:

1. **Deploy to staging** — Run `npm run deploy:staging`.
2. **Run post-deployment tests** — Execute `npx playwright test` against staging. If tests fail, report the failure and STOP.

---

## ⚡ "Full Throttle"

When the user says **"Full Throttle"**, execute these steps in order:

1. **Set site status to green** — `POST /api/site-status` with `{ "status": "green", "updated_by": "full-throttle" }`.
2. **Deploy to live** — Run `npm run deploy`. This builds and deploys to the live Cloudflare Worker.
3. **Run all post-deployment tests** — Execute `npx playwright test` against production.
4. **If all tests pass → set site status to golden** — `POST /api/site-status` with `{ "status": "golden", "updated_by": "full-throttle" }`.
5. **If any test fails → set site status to red** — `POST /api/site-status` with `{ "status": "red", "updated_by": "full-throttle" }` and STOP.

---

## Important Notes

- **Full Throttle** is a HIGH-RISK operation affecting production. The user saying "Full Throttle" is blanket approval to proceed.
- If any step in any command fails, report which step failed and what the error was.
- The pipeline gate hooks (CI checks, SonarQube) still apply — honour them.
- The version source of truth is `package.json` → re-exported via `src/data/siteStats.ts`.
