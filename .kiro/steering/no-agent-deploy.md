# No Agent Deploy — Raj Deploys Manually

## Rule

Kiro MUST NEVER run `astro build`, `wrangler deploy`, `npm run deploy`, or `npm run deploy:staging` autonomously. All deployments are done by Raj manually.

## What This Means

1. **Never run build commands** (`npx astro build`, `npm run build`) — Raj does this
2. **Never run deploy commands** (`npx wrangler deploy`, `npm run deploy`, `npm run deploy:staging`) — Raj does this
3. **Never kill the dev server for builds** — since builds are manual, there's no reason to kill it
4. **If testing requires staging/live**, ask Raj to deploy and confirm when it's up, then proceed with testing

## What Kiro CAN Do

- Write code, create files, modify files (per Dev Mode rules)
- Run `npm run dev` (start dev server)
- Run tests against localhost
- Run `wrangler d1 execute` for local DB operations (`--local`)
- Run scripts (Python, Node) locally
- Ask Raj to deploy when needed

## What Kiro CANNOT Do

- `npx astro build` or `npm run build`
- `npx wrangler deploy` (any config)
- `npm run deploy` or `npm run deploy:staging`
- `kill $(lsof -ti:PORT)` for build purposes
- Any command that deploys code to staging or live

## When Testing Needs Staging/Live

Say:
```
🚀 DEPLOY NEEDED
I've finished the changes. Please deploy to [staging/live] so I can test the [feature].
Let me know when it's up.
```

Then wait for Raj to confirm before testing against the remote URL.

## Applies To

All workspaces: SWF, xConvert, Coins, Playground. No exceptions.

## Agent Attribution

This is a **kiro** steering rule, created July 8, 2026.
