# Delegate Long-Running Commands — Don't Waste Agent Credits

## Rule

For any command that takes more than a few seconds to run (bulk scripts, embedding pipelines, large migrations, seed scripts, etc.), **DO NOT run it yourself**. Instead, give Raj the exact command to paste in his terminal.

## What This Means

1. **Don't run long-running scripts** — provide the command for Raj to run manually
2. **Don't run batch operations** — embedding 51 groups, seeding 1000 rows, bulk file processing
3. **Don't wait on network-heavy operations** — API calls that take 30+ seconds total
4. **Quick one-off checks are fine** — a single curl, a grep, a quick DB query (under 5 seconds) is OK to run directly

## Format

When providing commands for Raj to run, use a clean code block:

```bash
# Brief description of what this does
cd /path/to/workspace
command-to-run --with-flags
```

## Examples of What to Delegate

- `python3 tools/embed-dictionary.py --staging` (51 API calls, ~30s)
- `python3 tools/embed-blogs.py` (hundreds of embedding calls)
- `node scripts/sync-seo-index.mjs > /tmp/sync.sql && npx wrangler d1 execute DB --local --file=/tmp/sync.sql` (1000+ SQL statements)
- Large `wrangler d1 execute` with --file (100+ statements)
- Any script that processes all 1000+ blog files

## Examples of What Kiro CAN Run Directly

- Single curl to test an endpoint
- Grep/search across files
- Small DB queries (SELECT, single INSERT/UPDATE)
- `wc -l`, `ls`, `cat` — quick file checks
- Python scripts that modify <20 files (fast, under 5s)

## Why

Agent execution time = credits. Raj's terminal is free and faster for bulk operations. Reserve agent cycles for thinking, writing code, and making decisions — not watching progress bars.

## Agent Attribution

This is a **kiro** steering rule, created July 8, 2026.
