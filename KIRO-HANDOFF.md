# Kiro Development Environment — Complete Handoff Document

## GitHub Repository

**Repo:** https://github.com/rajnaik/xConvert24.git

Clone command:
```bash
git clone https://github.com/rajnaik/xConvert24.git ~/Code/xConvert.com
cd ~/Code/xConvert.com
npm install
```

---

## Project Architecture (Multi-Workspace Monorepo)

This repo contains **3 independent workspaces** sharing one git repo:

| Workspace | Path | Stack | Live URL | DB Binding |
|-----------|------|-------|----------|-----------|
| **xConvert24** | `/` (root, excluding `scrabblewordsfinder/` and `coins/`) | Astro 6 + Cloudflare Workers + D1 + Tailwind 4 | xconvert24.com | BUGS_DB |
| **ScrabbleWordsFinder (SWF)** | `/scrabblewordsfinder/` | Astro + Cloudflare Workers + D1 | scrabblewordsfinder.com | DB |
| **xCrypto24 (Coins)** | `/coins/` | Astro + Cloudflare Workers + D1 | xcrypto24.com (not yet live) | CRYPTO_DB |

Each workspace has:
- Own `package.json`, `astro.config.mjs`, wrangler configs
- Own D1 databases (dev/staging/live)
- Own deploy pipeline
- Shared `.kiro/` infrastructure (steering, hooks, specs)

---

## System Requirements

```
Node.js: v24.16.0+ (engines in package.json: >=22.12.0)
npm: 11.13.0+
Python: 3.13+ (for LTM memory system)
OS: macOS (darwin/zsh)
wrangler: installed as devDep (npx wrangler)
Playwright: installed as devDep
```

---

## Dev Mode — Workspace Write Lock (CRITICAL)

**Only ONE workspace may be written to at any time.** The user declares which workspace is active:

```
Dev Mode xconvert   → unlocks xConvert24 files
Dev Mode swf        → unlocks ScrabbleWordsFinder files
Dev Mode coins      → unlocks xCrypto24 files
```

When locked, you MUST NOT create/edit/delete files or run write-commands in that workspace. Reading is always allowed.

TTL: 3 hours sliding window. Auto-locks after 3h of inactivity.

---

## Environment Architecture

### xConvert24

| Env | Command | D1 (Main) | URL |
|-----|---------|-----------|-----|
| Dev | `npm run dev` | local miniflare | localhost:4321 |
| Staging | `npm run deploy:staging` | xconvert24-staging (e28a7b2a) | staging.xconvert24.com |
| Live | `npm run deploy` | xconvert24-bugs (433762c6) | xconvert24.com |

Configs: `wrangler.jsonc` (live), `wrangler.staging.jsonc`, `wrangler.dev.jsonc`

### SWF

| Env | Command | D1 | URL |
|-----|---------|-----|-----|
| Dev | `npm run dev` (from `/scrabblewordsfinder/`) | local miniflare | localhost |
| Staging | `npm run deploy:staging` | scrabble-staging (be0fad12) | workers.dev |
| Live | `npm run deploy` | scrabble-live (e9af2a48) | scrabblewordsfinder.com |

### xCrypto24

| Env | Command | D1 | URL |
|-----|---------|-----|-----|
| Dev | `npm run dev` (from `/coins/`) | local miniflare | localhost |
| Live | `npm run deploy` | crypto-live | xcrypto24.com (blocked until Ship It) |

---

## Build & Deploy Pipeline

```bash
# xConvert24
npm run build         # astro build + build-worker-entry.mjs (injects email handler)
npm run deploy:staging  # build + deploy to staging
npm run deploy        # build + deploy to live (requires "Full Throttle" command)

# Tests
npm run test          # all Playwright tests
npm run test:mobile   # mobile hamburger nav test
npm run test:deploy   # post-deploy smoke tests
```

The build pipeline adds an `email()` export to Astro's generated Worker via `scripts/build-worker-entry.mjs`.

---

## Installed Kiro Powers (10)

| Power | Purpose |
|-------|---------|
| **context7** | Live library/framework docs lookup |
| **tavily** | Web search, URL extraction, research |
| **image-utils** | Image manipulation (Pillow) |
| **aikido-security-scan** | SAST vulnerabilities, secrets, IaC misconfigs |
| **checkmarx** | Application security scanning (disabled) |
| **sonarqube** | Code quality analysis, tech debt |
| **cubic-code-review** | AI code review, PR reviews, wiki |
| **nova-act** | Browser-based QA testing |
| **amazon-location-service** | Maps, geocoding, routing |
| **ltm-power** | Project-local long-term memory |

---

## MCP Servers

### Workspace-level (`.kiro/settings/mcp.json`)
```json
{
  "mcpServers": {
    "astro-docs": {
      "url": "https://mcp.docs.astro.build/mcp",
      "disabled": false
    }
  }
}
```

### Power-provided MCPs (auto-managed):
- tavily (web search)
- cubic (code review)
- sonarqube (code quality)
- aws-mcp (Amazon Location)
- context7 (library docs)
- aikido (security scan)
- checkmarx (disabled)

---

## Agent Hooks (12 hooks in `.kiro/hooks/`)

| Hook | Event | Action | Purpose |
|------|-------|--------|---------|
| **xconvert-write-guard** | preToolUse (write) | askAgent | Requires explicit approval before any file write |
| **pre-write-test-check** | preToolUse (write) | askAgent | Checks for failing tests before allowing writes |
| **ui-test-watcher** | fileEdited (*.astro, *.html) | askAgent | Auto-suggest Playwright tests for UI changes |
| **swf-auto-tests** | fileEdited (SWF pages/api/layouts) | askAgent | Auto-generate/update SWF Playwright tests |
| **post-build-sanitise** | postTaskExecution | askAgent | Sanitise scan for sensitive content after builds |
| **post-deploy-test** | postTaskExecution | askAgent | Run Playwright suite after deploys |
| **post-live-email-tests** | postTaskExecution | askAgent | Run email tests after SWF live deploy |
| **post-build-code-scan** | postTaskExecution | askAgent | Remind to run SonarQube after builds |
| **ltm-postturn-capture** | agentStop | runCommand | Record agent activity to LTM memory |
| **no-auto-deploy** | userTriggered | askAgent | Manual gate for production deploys |
| **aikido-post-sonarqube** | postToolUse (.*sonar.*) | askAgent | Security scan after SonarQube (disabled) |
| **update-docs-on-change** | fileEdited (configs/migrations) | askAgent | Update docs on infra changes (disabled) |

---

## Steering Files (39 files in `.kiro/steering/`)

### Core Operations
| File | Purpose |
|------|---------|
| `dev-mode-lock.md` | Workspace write-lock system |
| `environments.md` | All environments, DBs, URLs, commands |
| `success-flag.md` | Visual banners (green DONE / red APPROVAL REQUIRED) |
| `auditlog-process.md` | Post-execution logging to AuditLog + org_tasks |

### SEO & Content
| File | Purpose |
|------|---------|
| `seoGuide.md` | Pre-deploy SEO checklist |
| `chromeExtSeoGuide.md` | Chrome Web Store ASO |
| `CheckSeoHealth.md` | SEO health check command |
| `seo-improve.md` | SEO improvement process |
| `xpolinate-process.md` | Cross-pollination (internal linking) |
| `metadesc-process.md` | Meta description generation |

### Build & Deploy
| File | Purpose |
|------|---------|
| `full-throttle.md` | Full build + deploy pipeline (live) |
| `hack-process.md` | HACK N — create N new pages |
| `chop-process.md` | CHOP N — write N blog posts |
| `prettify-process.md` | Prettify blog posts |
| `composite-pipelines.md` | Multi-step pipeline definitions |
| `blog-pipeline-reminder.md` | Blog pipeline workflow |
| `blog-template.md` | Blog post template |
| `silent-push.md` | Silent git push without deploy |

### Testing & Quality
| File | Purpose |
|------|---------|
| `uiTestingGuide.md` | Playwright test standards |
| `ui-test-specialist.md` | Automated test generation spec |
| `sanitise-swf.md` | Content/sensitive data scan |
| `post-deploy-email-tests.md` | Email verification after deploy |

### Email & Forms
| File | Purpose |
|------|---------|
| `emailGuide.md` | Email architecture, rules, schema |

### Admin & Infrastructure
| File | Purpose |
|------|---------|
| `adminPagesGuide.md` | Standard admin pages set |
| `aws-org-ids.md` | AWS IDs, GA4, Chrome Store, business registration |
| `createWorkspace.md` | Bootstrap new workspace command |
| `crosscoupling.md` | "Suggest a Feature" links on all pages |

### Feature Porting
| File | Purpose |
|------|---------|
| `ports-swf-to-xconvert.md` | Feature port tracking list |
| `pushFeature-banners.md` | Port banner system between workspaces |
| `CheckPorts.md` | Compare features between workspaces |

### SWF-Specific
| File | Purpose |
|------|---------|
| `swf-brand-keywords.md` | Brand keywords for SWF |
| `swf-blog-summary.md` | Blog ideas summary command |
| `swf-admin-auth-reminder.md` | Admin auth config |
| `scrabble-solver.md` | Scrabble solver logic |
| `FreshClicks.md` | Purge/repopulate xConvert clicks |
| `FreshClicks-SWF.md` | Purge/repopulate SWF clicks |
| `SyncAll.md` | Sync all data across environments |

### Media & Chrome Extension
| File | Purpose |
|------|---------|
| `MediaSetNeeded.md` | Chrome extension release media checklist |

### LTM Memory
| File | Purpose |
|------|---------|
| `ltm-memory-format.md` | LTM data format spec |
| `ltm-operations.md` | LTM recall/checkpoint/maintenance commands |

---

## Custom Skills (`.agents/skills/`)

1. **aikido-security** — Security scanning integration
2. **seo-aeo-best-practices** — SEO/AEO principles with references (E-E-A-T, structured data, technical SEO, AEO considerations)

---

## LTM (Long-Term Memory) System

Location: `ltm/` directory at project root.

```
ltm/
├── bin/ltm.py         — CLI tool (Python 3.13)
├── config.json        — Configuration
├── runtime/
│   ├── active-context.json
│   └── last-recall.md
└── store/
    ├── events.jsonl    — 1329 events
    └── checkpoints.jsonl — 1 checkpoint
```

### Key Commands
```bash
python3 ltm/bin/ltm.py recall          # Quick recall
python3 ltm/bin/ltm.py sessions --limit 5   # Recent sessions
python3 ltm/bin/ltm.py checkpoints --days 7  # Recent checkpoints
python3 ltm/bin/ltm.py search "term"         # Search memory
python3 ltm/bin/ltm.py capture-turn          # Capture (auto via hook)
python3 ltm/bin/ltm.py checkpoint --from-json <path>  # Save checkpoint
python3 ltm/bin/ltm.py health                # Health check
python3 ltm/bin/ltm.py validate              # Validate store
python3 ltm/bin/ltm.py repair                # Fix issues
```

### Latest Checkpoint Summary (June 13, 2026)
- Built entire xCrypto24 workspace (coins tracker, DexScreener/RugCheck/GeckoTerminal, Lightweight Charts)
- ABC Chrome Extension v1.0.3 to v1.0.11 (background worker, find on page, new logo)
- SWF deployed live with telemetry fix + saved words admin
- xConvert got Databases admin panel + email integration (Cloudflare Email Service)

### Open Threads
1. **xcrypto24-go-live** — 5 remaining tasks before Ship It
2. **seo-programmatic-pages** — Programmatic SEO for SWF
3. **abc-chrome-store-publish** — Fix mini chart, publish to Chrome Store

---

## Reusable Packages (`.kiro/packages/`)

| Package | Purpose |
|---------|---------|
| `banners/` | Banner rotation system (DB, API, admin UI) |
| `telemetry/` | Endpoint health monitoring |

Used with `pushFeature` command to port features between workspaces.

---

## Steering Commands (Say These Exactly)

| Command | What It Does |
|---------|-------------|
| `Dev Mode xconvert` | Unlock xConvert for writes |
| `Dev Mode swf` | Unlock SWF for writes |
| `Dev Mode coins` | Unlock Coins for writes |
| `Full Throttle` | Full build + deploy to LIVE |
| `Half Throttle` | Build + deploy to STAGING only |
| `Ship It` | Quick deploy (same as Full Throttle) |
| `HACK N` | Create N new tool/converter pages |
| `CHOP N` | Write N blog posts from blog_ideas |
| `Prettify` | Polish/SEO-enhance blog posts |
| `Fire Your Engine` | Start dev server |
| `Full Maintenance` | Run all maintenance tasks |
| `Blog Burst` | Batch blog creation |
| `Converter Burst` | Batch converter creation |
| `Spring Clean` | Code cleanup pass |
| `Polish` | UI refinement pass |
| `FreshClicks` | Purge + repopulate clicks data on dev |
| `FreshClicks SWF` | Same for SWF workspace |
| `Sanitise SWF` | Scan SWF for sensitive content |
| `CheckPorts swf` | Compare SWF features vs xConvert |
| `pushFeature swf xconvert <feature>` | Port feature between workspaces |
| `CrossCoupling` | Add "Suggest" links to all pages |
| `SyncAll` | Sync data across environments |
| `CheckSeoHealth` | Run SEO health check |
| `SEOImprove` | Improve page SEO |
| `xPolinate` | Cross-link related pages |
| `Metadesc` | Generate meta descriptions |
| `recall state` | Show LTM memory + project state |
| `show summary blog ideas` | Blog ideas summary table |

---

## Key APIs (xConvert24)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/clicks` | POST/GET | Click tracking (20 fields) |
| `/api/contact` | POST | Contact form — DB + email |
| `/api/suggest` | POST | Suggest form — DB + email |
| `/api/emails` | GET/PUT/DELETE | Emails CRUD |
| `/api/banners` | GET/PUT | Banner rotation |
| `/api/banner-click` | POST | Banner click tracking |
| `/api/telemetry` | GET | Endpoint health check |
| `/api/site-status` | GET/PUT | Site status + logo |
| `/api/auditlog` | POST/GET | Audit logging |
| `/api/org-chart` | POST/GET | Org tasks (agent tracking) |
| `/api/auth/login` | GET | Google OAuth redirect |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/auth/logout` | GET | Session clear |

---

## Database Tables (xConvert24 D1)

| Table | Purpose |
|-------|---------|
| `emails` | Contact/suggest submissions |
| `clicks` | User interactions (20 fields) |
| `ClicksAnalysis` | Geo-enriched click aggregation |
| `telemetry` | Endpoint health history |
| `site_status` | Status + logo option |
| `banners` | Banner rotation pool (10 rows) |
| `banner_clicks` | Banner click events |
| `test_results` | Automated test pass/fail |
| `AuditLog` | Command execution log |
| `org_tasks` | Agent activity tracking |
| `tasks` | Project task management |
| `suggestions` | Legacy suggestions |

---

## Key Decisions & Constraints

1. **D1 limit: 10 databases max** — Be careful creating new ones
2. **No auto-deploy to production** — Requires "Full Throttle" or "Ship It"
3. **All admin pages behind Google OAuth** — Allowed: raj007@gmail.com, xconvert24@gmail.com
4. **Save-before-send pattern** — Always save to DB before attempting email
5. **Worker secrets for sensitive data** — Never hardcode emails/keys
6. **Email binding name: EMAIL** — Consistent across all environments
7. **Astro SSR mode** — `output: 'server'` with Cloudflare adapter
8. **Tailwind CSS v4** — via `@tailwindcss/vite` plugin
9. **Analytics = /admin/clicks-analysis** (our own data), NOT Google Analytics
10. **xcrypto24.com deploy blocked** — Until Full Throttle/Ship It command

---

## Chrome Extensions (in `/admin/ChromeExt/`)

### ABC (Auto Button Clicker)
- Path: `/admin/ChromeExt/ABC/`
- Version: 1.0.11
- Manifest V3 with activeTab, scripting, storage, tabs permissions
- Publisher ID: d52aead3-704d-46fd-869f-7a09dcdf5ca5

---

## Agent Attribution

When logging to AuditLog/org_tasks, use these agent IDs:

| Agent | Responsible For |
|-------|----------------|
| **kiro** | Fire Your Engine, Half/Full Throttle, Ship It, HACK, FreshClicks, Full Maintenance, Converter Burst, Spring Clean |
| **quill** | CHOP, Prettify, Metadesc, Blog Pipeline, Blog Burst, Polish |
| **archer** | SEOImprove, CheckSeoHealth, xPolinate |

---

## Visual Signals

On **success** (task completed):
```
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
✅ **DONE**
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩
```

On **approval required** (any question/decision/confirmation):
```
🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
🛑 **APPROVAL REQUIRED**
🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥
```

---

## Setup Instructions for New Kiro

### Step 1: Clone & Install
```bash
git clone https://github.com/rajnaik/xConvert24.git ~/Code/xConvert.com
cd ~/Code/xConvert.com
npm install
cd scrabblewordsfinder && npm install && cd ..
cd coins && npm install && cd ..
```

### Step 2: Verify .kiro/ directory exists
The `.kiro/` directory should come with the repo. Verify:
- `.kiro/steering/` — 39 steering files
- `.kiro/hooks/` — 12 hook files
- `.kiro/settings/mcp.json` — Astro docs MCP
- `.kiro/packages/` — Reusable feature packages
- `.kiro/specs/` — Existing spec docs

### Step 3: Install Powers
In Kiro's Powers panel, install:
1. ltm-power (project memory)
2. tavily (web search)
3. context7 (library docs)
4. cubic-code-review (code review)
5. sonarqube (code quality)
6. aikido-security-scan (security)
7. image-utils (image processing)
8. amazon-location-service (maps)
9. nova-act (browser QA testing)
10. checkmarx (optional, can be disabled)

### Step 4: LTM Memory
The `ltm/` directory should be in the repo. Verify with:
```bash
python3 ltm/bin/ltm.py health
python3 ltm/bin/ltm.py checkpoints --days 30
```

### Step 5: Secrets (per environment)
These need to be configured via `wrangler secret put`:
- `SWF_NOTIFY_EMAIL` — Notification email for forms
- `GOOGLE_CLIENT_ID` — OAuth client ID
- `GOOGLE_CLIENT_SECRET` — OAuth client secret

### Step 6: Verify Build
```bash
npm run build  # Should complete with "Added email() handler" message
```

---

## How I (The User) Work

1. **I say "Dev Mode X"** to unlock a workspace before any work
2. **I give short commands** — "HACK 5", "Full Throttle", "Deploy staging"
3. **I expect verbose approval requests** before file writes (the write-guard hook enforces this)
4. **I use steering commands by name** — just say the command, follow the steering file exactly
5. **I review builds before deploy** — staging first, then live
6. **I track everything** — AuditLog, org_tasks, test_results must be updated
7. **I care about SEO** — every page needs FAQ schema, meta tags, 150+ words of content
8. **I run multiple projects simultaneously** — but only one workspace is writable at a time
9. **I want visual confirmation** — green flag on success, red flag when asking questions
10. **I expect you to know the full context** — use `recall state` at conversation start

---

## Current Status (as of June 13, 2026)

### Completed Recently
- xConvert email integration (Cloudflare Email Service — inbound + outbound)
- xCrypto24 workspace scaffolded (DexScreener, RugCheck, GeckoTerminal, Lightweight Charts)
- ABC extension v1.0.11 (full cog icon, background worker)
- SWF saved words admin page
- xConvert databases admin panel

### Pending / Open Threads
1. **xcrypto24.com go-live** — 5 remaining tasks
2. **Programmatic SEO pages** for SWF
3. **ABC Chrome Store publish** — mini chart fix needed
4. **SWF banner-rotation.new.spec.ts** — test not yet validated

### Git Status
- Branch: `feature/map-tools-image-editor-code-reviews`
- Uncommitted: wrangler configs, email integration files, coins analysis page
- Untracked: email spec, _worker.ts, build-worker-entry.mjs, email handler files

---

## File to Give New Kiro

Give them this file (KIRO-HANDOFF.md). They should:
1. Read it completely
2. Run `recall state` to check LTM
3. Verify all hooks/steering files are present
4. Ask you for `Dev Mode X` before making any changes
5. Follow all steering commands exactly as documented
6. Use the visual signals (green/red flags)
7. Never deploy without explicit "Full Throttle" or "Ship It"
