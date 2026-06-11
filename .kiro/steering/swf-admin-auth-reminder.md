---
inclusion: fileMatch
fileMatchPattern: 'scrabblewordsfinder/src/pages/admin/**'
---

# Reminder: SWF Admin — Google Authentication Required

The `/admin/` section of ScrabbleWordsFinder currently has **NO authentication**. 

## Action Needed
- Add Google OAuth/OpenID Connect to protect all `/admin/*` routes
- Options:
  1. Cloudflare Access (Zero Trust) — easiest, no code changes
  2. Google OAuth via Workers middleware — more control, custom login page
  3. Simple shared secret/cookie approach for MVP

## When
- Before deploying to live/production
- The admin pages are: `/admin/`, `/admin/reports/`, `/admin/ops/`

## What to Protect
- `/admin/*` — all admin routes
- `/api/tasks` — the tasks CRUD API (should require auth for write operations)

When the user mentions "admin auth", "protect admin", or "google auth for SWF", this is the context.
