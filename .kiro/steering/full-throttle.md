---
inclusion: manual
---

# Deployment Commands

Three voice commands control the deploy pipeline. Stop immediately if any step fails and report the failure.

---

## 🔥 "Fire Your Engine"

When the user says **"Fire your engine"**, execute these steps in order:

1. **Commit to git** — Stage all changes, commit with message `v{version} — {short summary}`. *(Git push to GitHub is currently DISABLED — skip the push step.)*
2. **Build** — Run `npm run build` to verify the project compiles cleanly.
3. **Update release notes** — Add a new entry to `src/pages/releases.astro` with the current version, today's date, and a summary of changes since the last release (check recent git commits).
4. **Run tests** — Execute `npx playwright test`. If tests fail, report the failure and STOP.

---

## 🚀 "Half Throttle"

When the user says **"Half Throttle"**, execute these steps in order:

1. **Deploy to staging** — Run `npm run deploy:staging`.
2. **Run post-deployment tests** — Execute `npx playwright test` against staging. If tests fail, report the failure and STOP.

---

## ⚡ "Full Throttle"

When the user says **"Full Throttle"**, execute these steps in order:

1. **Set site status to green** — via D1 direct:
   ```bash
   npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, 'green', datetime('now'), 'full-throttle');"
   ```
2. **Deploy to live** — Run `npm run deploy`. This builds and deploys to the live Cloudflare Worker.
3. **Run all post-deployment tests** — Execute `TEST_BASE_URL=https://www.xconvert24.com npx playwright test` against production. Tests MUST always run against the environment that was just deployed.
4. **If all tests pass → set site status to golden**:
   ```bash
   npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, 'golden', datetime('now'), 'full-throttle');"
   ```
5. **If any test fails → set site status to red** and STOP:
   ```bash
   npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, 'red', datetime('now'), 'full-throttle');"
   ```
6. **Push to GitHub** — Push the current branch to origin:
   ```bash
   git push
   ```
7. **Sanitise release notes** — Open `src/pages/releases.astro` and scan ALL release entries for:
   - **Email addresses** — remove or replace with `[redacted]`
   - **Staff/employee names** — remove real names of developers, agents, or team members (display names like "kiro", "quill", "archer" are fine)
   - **Internal architecture details** — remove references to specific file paths (e.g. `src/layouts/Layout.astro line 42`), internal database IDs, API keys, or infrastructure specifics that expose the file system structure
   - **Sensitive config** — remove any KV IDs, D1 database IDs, Cloudflare account IDs, or internal URLs not meant for public consumption
   
   If anything is found and removed, commit with message `chore: sanitise release notes`, rebuild, and redeploy to all 3 environments (staging + live).

---

## Important Notes

- **Full Throttle** is a HIGH-RISK operation affecting production. The user saying "Full Throttle" is blanket approval to proceed.
- If any step in any command fails, report which step failed and what the error was.
- The pipeline gate hooks (CI checks, SonarQube) still apply — honour them.
- The version source of truth is `package.json` → re-exported via `src/data/siteStats.ts`.
