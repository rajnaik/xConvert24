---
inclusion: always
---

# AuditLog — Post-Execution Logging

After **every** steering command completes (HACK, CHOP, Prettify, xPolinate, Metadesc, Fire Your Engine, Half Throttle, Full Throttle, Blog Pipeline, Full Maintenance, Polish, Blog Burst, Converter Burst, Ship It, Spring Clean), log the result to the AuditLog table.

---

## When to Run

Automatically after any steering command finishes — whether it succeeded or failed.

## Steps

1. Determine the command name (e.g., "HACK5", "CHOP3", "Full Throttle", "Blog Burst")
2. Determine the status: `1` = success (all steps completed), `0` = failure (any step failed)
3. Write a short `details` summary of what happened (e.g., "Prettified 3 blog posts: bitcoin-vs-gold, gold-weight-troy-ounces, understanding-bitcoin-supply" or "Failed: build error in Layout.astro line 42")
4. POST to the audit log API on the dev environment (the Ops Console polls this):

```bash
curl -X POST http://localhost:4321/api/auditlog \
  -H "Content-Type: application/json" \
  -d '{"command": "COMMAND_NAME", "status": 1, "details": "Short summary of result"}'
```

For production/staging environments as well:
```bash
# Live
curl -X POST https://www.xconvert24.com/api/auditlog \
  -H "Content-Type: application/json" \
  -d '{"command": "COMMAND_NAME", "status": 1, "details": "Short summary of result"}'
```

Or via wrangler for direct DB insert:
```bash
npx wrangler d1 execute xconvert24-bugs --remote --command "INSERT INTO AuditLog (command, status, details) VALUES ('COMMAND_NAME', 1, 'Summary here');"
npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc --command "INSERT INTO AuditLog (command, status, details) VALUES ('COMMAND_NAME', 1, 'Summary here');"
npx wrangler d1 execute BUGS_DB --remote --config wrangler.staging.jsonc --command "INSERT INTO AuditLog (command, status, details) VALUES ('COMMAND_NAME', 1, 'Summary here');"
```

## Schema

```sql
CREATE TABLE AuditLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 1,
  details TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Details Field — Required

The `details` field is **mandatory** for every audit log entry. The Ops Console polls for entries with non-empty `details` to show success/failure feedback to the user in real time.

**On success**, write a concise summary:
- "Prettified 3 blogs: bitcoin-vs-gold, gold-weight-troy-ounces, understanding-bitcoin-supply"
- "HACK5: Created 5 new converter pages"
- "Deployed to staging — all 12 tests passed"

**On failure**, write what went wrong:
- "Failed: TypeScript error in BlogPost.astro line 42"
- "CHOP3: Only 2 of 3 blogs generated — template error on #3"
- "Build failed: missing dependency @astrojs/cloudflare"

## Important

- Always log, even on failure (status = 0)
- Always include a `details` summary — the Ops Console relies on this for live feedback
- Use the exact command name as spoken by the user (e.g., "HACK5" not "hack")
- The `created_at` is auto-populated by the database
- This runs AFTER the command — never block or delay the main operation for logging
