---
inclusion: manual
---

# SyncAll — Sync Remote Dev DB to Local Miniflare

When the user says **"SyncAll"**, copy all key tables from the remote dev D1 database into the local miniflare SQLite files so the dev server dashboard displays real data.

## Why This Exists

`npm run dev` uses local miniflare SQLite files for D1 bindings — NOT the remote database. Wrangler CLI `--remote` writes to the remote DB, but the running dev server reads from local files. This command bridges the gap.

## Steps

1. **Identify the local miniflare DB file** that the dev server uses:
   ```bash
   # Find which local sqlite has the main tables
   for f in .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite; do
     count=$(sqlite3 "$f" "SELECT COUNT(*) FROM AuditLog;" 2>/dev/null)
     if [ -n "$count" ]; then echo "$f → $count AuditLog rows"; fi
   done
   ```

2. **Sync AuditLog** — Export from remote, insert into local:
   ```bash
   # Get remote data
   npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc \
     --command "SELECT id, command, status, details, created_at FROM AuditLog ORDER BY id DESC LIMIT 50;" --json

   # Insert into local sqlite (use the file identified in step 1)
   sqlite3 LOCAL_DB_FILE "INSERT OR IGNORE INTO AuditLog (id, command, status, details, created_at) VALUES (...);"
   ```

3. **Sync org_tasks** — Export from remote, insert into local:
   ```bash
   npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc \
     --command "SELECT id, agent_id, task, duration, created_at FROM org_tasks ORDER BY id DESC LIMIT 50;" --json

   sqlite3 LOCAL_DB_FILE "INSERT OR IGNORE INTO org_tasks (id, agent_id, task, duration, created_at) VALUES (...);"
   ```

4. **Sync ClicksAnalysis** — Export from live, insert into local:
   ```bash
   npx wrangler d1 execute xconvert24-bugs --remote \
     --command "SELECT ip_address, click_count, latitude, longitude, city, country, last_seen FROM ClicksAnalysis;" --json

   # Purge and repopulate local
   sqlite3 LOCAL_DB_FILE "DELETE FROM ClicksAnalysis;"
   sqlite3 LOCAL_DB_FILE "INSERT INTO ClicksAnalysis (ip_address, click_count, latitude, longitude, city, country, last_seen) VALUES (...);"
   ```

5. **Sync org_agents** — Export from remote, insert into local:
   ```bash
   npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc \
     --command "SELECT agent_id, name, role, icon, status, updated_at FROM org_agents;" --json

   sqlite3 LOCAL_DB_FILE "INSERT OR REPLACE INTO org_agents (agent_id, name, role, icon, status, updated_at) VALUES (...);"
   ```

6. **Ensure tables exist locally** — If any table is missing in the local file, create it:
   ```sql
   CREATE TABLE IF NOT EXISTS ClicksAnalysis (id INTEGER PRIMARY KEY AUTOINCREMENT, ip_address TEXT NOT NULL, click_count INTEGER DEFAULT 1, latitude REAL, longitude REAL, city TEXT DEFAULT '', country TEXT DEFAULT '', last_seen TEXT DEFAULT (datetime('now')));
   CREATE TABLE IF NOT EXISTS org_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id TEXT NOT NULL, task TEXT NOT NULL, duration TEXT, created_at TEXT DEFAULT (datetime('now')));
   CREATE TABLE IF NOT EXISTS org_agents (agent_id TEXT PRIMARY KEY, name TEXT, role TEXT, icon TEXT, status TEXT DEFAULT 'active', updated_at TEXT);
   ```

## Tables to Sync

| Table | Source | Direction |
|-------|--------|-----------|
| AuditLog | Remote dev DB | remote → local |
| org_tasks | Remote dev DB | remote → local |
| org_agents | Remote dev DB | remote → local |
| ClicksAnalysis | Live DB | live → local |

## Notes

- This does NOT sync `clicks`, `bugs`, `suggestions`, `opinions`, or other high-volume tables — only the dashboard-critical ones.
- Run this after a fresh `npm run dev` startup or when the dashboard shows stale/empty data.
- The dev server does NOT need to be restarted after sync — the SQLite changes are picked up on next query.
- Do NOT modify the local `.wrangler/state/v3/d1/` files while in production — they are gitignored and local-only.
