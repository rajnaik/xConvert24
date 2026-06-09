---
inclusion: manual
---

# Silent Push — Build, Test & Deploy to Staging (No Version Bump)

When the user says **"Silent Push"**, execute these steps in order. This is for incremental work that doesn't warrant a version bump or release note — those are saved for the next big release.

---

## Steps

1. **Stage & commit** — Stage all changes and commit with message: `silent: {short summary of changes}`
2. **Build** — Run `npm run build`. If it fails, STOP and report the error.
3. **Run tests** — Execute `npx playwright test`. If any test fails, STOP and report which tests failed.
4. **Deploy to staging** — Run `npm run deploy:staging`.
5. **Log to AuditLog** — POST to local API + remote DB:

```bash
curl -X POST http://localhost:4321/api/auditlog \
  -H "Content-Type: application/json" \
  -d '{"command": "Silent Push", "status": 1, "details": "Summary of changes deployed to staging"}'
```

---

## What NOT to do

- ❌ Do NOT bump the version in `package.json`
- ❌ Do NOT update `src/pages/releases.astro`
- ❌ Do NOT deploy to live (`npm run deploy`)
- ❌ Do NOT push to GitHub
- ❌ Do NOT update site_status in D1

---

## When tests fail

If tests fail, log the failure:
```bash
curl -X POST http://localhost:4321/api/auditlog \
  -H "Content-Type: application/json" \
  -d '{"command": "Silent Push", "status": 0, "details": "Failed: test XYZ error message"}'
```

Then report the failure to the user and STOP.

---

## Agent Attribution

This is a **kiro** command for AuditLog/org_tasks purposes.
