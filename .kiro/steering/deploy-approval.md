# Deploy Approval — MANDATORY for All Live Deployments

## Rule

**NEVER deploy to live without explicit approval from Raj.** This applies to ALL workspaces — SWF, xConvert, Coins, Playground. No exceptions.

## Process

1. **Build** — run `astro build` and confirm it passes
2. **Deploy to staging** — push to staging environment first
3. **Verify on staging** — confirm the feature works (check URLs, APIs, interactions)
4. **Ask for approval** — present what's being deployed and ask Raj: "Ready to deploy to live?"
5. **Only deploy to live after Raj says yes**

## What Requires Approval

- `npx wrangler deploy` (live deploy for any workspace)
- `npm run deploy` (if it targets live)
- Any `--remote` database write that modifies live data (INSERT/UPDATE/DELETE on live DBs)
- Migration applies to live databases

## What Does NOT Require Approval

- Deploying to staging (`npm run deploy:staging`)
- Local dev builds (`npm run dev`)
- Writing to local miniflare databases (`--local`)
- Writing to dev/staging remote databases
- File writes within the workspace (governed by Dev Mode)

## How to Ask

Before any live deploy, show:
```
🚀 DEPLOY TO LIVE?
━━━━━━━━━━━━━━━━━━
Workspace: [SWF / xConvert / Coins / PG]
Changes: [brief summary of what's being deployed]
Staging verified: [yes/no]
Risk level: [low/medium/high]

Deploy to live? (yes/no)
```

Wait for explicit "yes" before running `wrangler deploy`.

## Magic Words for Approval

Either of these phrases from Raj counts as explicit deployment approval:
- **"Ship It"**
- **"Full Throttle"**

Both mean the same thing: "I approve this live deployment, proceed."

## Violations

If Kiro deploys to live without approval, this is a **critical failure**. Raj will flag it. No excuses — the rule is absolute.

## Applies To

All workspaces. All environments. All time. No exceptions even if "it's just a small change."
