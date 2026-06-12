# CheckPorts X — Compare Features Between Workspaces

When the user says "CheckPorts swf" (or any workspace name), compare that workspace's features against xConvert24 and report what's missing.

## Syntax

```
CheckPorts <workspace>
```

Example: `CheckPorts swf` — lists all SWF features not yet on xConvert24.

## How to Run

1. Read the ports list from `.kiro/steering/ports-swf-to-xconvert.md`
2. Check which features exist in xConvert by scanning for key files/patterns:

| Feature | Check for in xConvert |
|---------|----------------------|
| Banner Rotation | `src/pages/api/banners.ts` |
| Telemetry | `src/pages/api/telemetry.ts` |
| Click Tracking (full) | 20-field click tracker in Layout |
| Cookie Consent | `src/components/CookieConsent.astro` |
| Email Service | `src/pages/api/contact.ts` |
| Admin Emails CRUD | `src/pages/admin/emails.astro` |
| Admin Clicks | `src/pages/admin/clicks.astro` or similar |
| Google OAuth | `src/middleware.ts` with auth check |
| Release Train | `src/pages/admin/release-train.astro` |
| Environments Page | `src/pages/admin/environments.astro` |
| Footer Click Counter | `footer-clicks-value` in Layout |
| Social Card | `og:image` in Layout head |
| Admin noindex | `robots.*noindex` in Layout |
| Sanitise tests | `tests/sanitise.spec.ts` |
| FAQ schema per page | `FAQPage` in page files |
| Emails table | `emails` table in DB |
| Telemetry history | `telemetry` table in DB |

3. Report as a table:

```
Feature                  | SWF | xConvert | Action Needed
─────────────────────────┼─────┼──────────┼──────────────
Cookie Consent           | ✅  | ❌       | Port needed
Google OAuth             | ✅  | ❌       | Port needed
Click Tracking (full)    | ✅  | ⚠️ basic | Upgrade needed
Telemetry                | ✅  | ❌       | Port needed
```

4. Suggest priority order based on the ports steering file.

## After Running

- Update the ports file with current status
- Add any newly discovered features to the list
- Suggest next action: "Run `pushFeature swf xconvert <feature>` to port"

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
