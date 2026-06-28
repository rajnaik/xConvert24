# Review Tech Stack — Dependency Management & Upgrade Tracker

Triggered by saying "Review Tech Stack" or automatically every 2 weeks.

## Process

When triggered:
1. Run `npm info <package> version` for each dependency to get latest available
2. Compare with installed versions
3. Update the table below
4. Flag any **breaking changes** or **security advisories**
5. Recommend which to upgrade now vs defer
6. Present the table to Raj for decisions
7. **MANDATORY: Update the public-facing Tech Stack page** (`/tech-stack/`) to reflect any version changes — see "Post-Review: Update Tech Stack Page" section below

## Dependency Table

Last reviewed: **June 14, 2026**

### Core Framework

| Package | xConvert Installed | SWF Installed | Latest Available | Breaking Changes | Target Upgrade |
|---------|-------------------|---------------|-----------------|-----------------|----------------|
| **astro** | 6.4.4 | 6.4.4 | 6.4.6 | None (patch) | Next session |
| **@astrojs/cloudflare** | 13.6.1 | 13.6.1 | 13.7.0 | None (minor) | Next session |
| **tailwindcss** | 4.3.0 | 4.3.0 | 4.3.1 | None (patch) | Next session |
| **@tailwindcss/vite** | 4.3.0 | 4.3.0 | 4.3.1 | None (patch) | Next session |

### Build & Deploy

| Package | xConvert Installed | SWF Installed | Latest Available | Breaking Changes | Target Upgrade |
|---------|-------------------|---------------|-----------------|-----------------|----------------|
| **wrangler** | 4.97.0 | 4.97.0 | 4.100.0 | None (minor) | Review changelog |
| **typescript** | — | 6.0.3 | 6.0.3 | ✅ Current | — |
| **@astrojs/check** | — | 0.9.9 | 0.9.9 | ✅ Current | — |

### Testing

| Package | xConvert Installed | SWF Installed | Latest Available | Breaking Changes | Target Upgrade |
|---------|-------------------|---------------|-----------------|-----------------|----------------|
| **@playwright/test** | 1.60.0 | 1.52.0 | 1.60.0 | SWF behind (minor) | Align SWF to 1.60 |

### Runtime

| Tool | Installed | Latest Available | Notes |
|------|-----------|-----------------|-------|
| **Node.js** | 24.16.0 | 24.x (current) | ✅ Current |
| **npm** | (bundled with Node) | — | — |

### Hosting & Services

| Service | Purpose | Plan | Notes |
|---------|---------|------|-------|
| **Cloudflare Workers** | Hosting (SSR) | Free | — |
| **Cloudflare D1** | Database | Free | 10 DB limit |
| **Cloudflare KV** | Session store | Free | — |
| **Cloudflare Email** | Outbound email | Free | — |
| **Cloudflare Vectorize** | Vector DB (RAG) | Free tier | SWF: `swf-blog-rag` index |
| **Cloudflare Workers AI** | AI inference | Free tier | SWF: `AI` binding |
| **Cloudflare Pages** | Static assets | Free (via Workers) | — |
| **Google OAuth** | Admin auth | Free | — |
| **DictionaryAPI.dev** | Word definitions | Free | Rate limited |

### Optional / Plugin

| Package | Workspace | Installed | Latest | Notes |
|---------|-----------|-----------|--------|-------|
| **astro-mcp** | xConvert | 0.4.2 | Check | MCP integration |

## Upgrade Decision Matrix

| Risk Level | Action |
|-----------|--------|
| Patch (x.x.N) | Auto-upgrade, no review needed |
| Minor (x.N.0) | Review changelog, upgrade if no breaking changes |
| Major (N.0.0) | Full review, test on staging, schedule upgrade |
| Security fix | Immediate upgrade regardless of version jump |

## Commands to Run During Review

```bash
# Check all latest versions at once
echo "=== Latest Versions ==="
npm info astro version
npm info @astrojs/cloudflare version
npm info tailwindcss version
npm info @tailwindcss/vite version
npm info wrangler version
npm info @playwright/test version
npm info typescript version
npm info @astrojs/check version

# Update xConvert
cd /Users/rajeevnaik/Code/xConvert.com && npm update

# Update SWF
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npm update

# Verify builds after upgrade
cd /Users/rajeevnaik/Code/xConvert.com && npx astro build
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx astro build
```

## Post-Review: Update Tech Stack Page (MANDATORY)

After completing the review and updating this steering file, **ALWAYS update the public-facing Tech Stack page** at `scrabblewordsfinder/src/pages/tech-stack.astro` (and any equivalent in other workspaces) so users see current versions. This ensures the live site always reflects reality. **This step is non-optional** — the review is not complete until the page is updated.

Steps:
1. Compare the versions in the Dependency Table above with what's shown on `/tech-stack/`
2. Update any stale version numbers on the page
3. Add/remove any services that changed (e.g., new Cloudflare bindings, deprecated tools)
4. Verify the page still builds cleanly
5. If versions changed on the page, note it in the History table below

## Schedule

- **Review frequency:** Every 2 weeks
- **Next review due:** June 28, 2026
- **Reminder trigger:** User says "Review Tech Stack" or Kiro reminds after 14 days of inactivity on this topic

## History

| Date | Changes Made |
|------|-------------|
| June 14, 2026 | Initial table created. All deps at current or near-current. SWF Playwright behind (1.52 → 1.60). |
