# Dev Server Always On — Never Kill Unnecessarily

## Rule

The dev server for the active Dev Mode workspace MUST be kept running at all times during sessions. **Never** stop, kill, or restart it unless absolutely required.

## When Killing Is Allowed

The ONLY acceptable reason to kill the dev server is:
1. **Right before `astro build`** — the build process conflicts with the running dev server
2. **Right before `wrangler deploy`** — same conflict

After the build or deploy completes, **restart the dev server immediately** as the very next step.

## When Killing Is NOT Allowed

- At session start (check if it's already running first)
- Before running tests (tests don't conflict with dev server)
- Before reading files or making edits
- "Just to be safe" or "to get a clean state"
- When switching tasks within the same workspace

## Correct Pattern

```bash
# CHECK if dev server is running — don't kill it
lsof -ti:4321  # If this returns a PID, it's running. Leave it alone.

# ONLY before build/deploy:
kill $(lsof -ti:4321) 2>/dev/null
npx astro build && npx wrangler deploy
# Immediately restart:
npm run dev
```

## Wrong Pattern (DO NOT DO THIS)

```bash
# ❌ Killing at session start "just in case"
kill $(lsof -ti:4321) 2>/dev/null && npm run dev

# ❌ Killing before tests
kill $(lsof -ti:4321) && npx playwright test ...

# ❌ Killing to "restart fresh"
kill $(lsof -ti:4321) && npm run dev
```

## Port Assignments (Fixed)

| Workspace | Port |
|-----------|------|
| SWF | 4321 |
| xConvert | 4322 |
| Coins | 4323 |
| Playground | 4324 |

## At Session Start

1. Check if the dev server is already running: `lsof -ti:<PORT>`
2. If running → do nothing, confirm to user: "Dev server already running at http://localhost:<PORT>"
3. If NOT running → start it: `cd <workspace> && npm run dev`

## Agent Attribution

This is a **kiro** steering rule, created June 27, 2026.
