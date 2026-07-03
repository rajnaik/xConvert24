# Refactor Reminder — Tech Debt & Code Health

## Rule

After every major feature delivery (or once per session if multiple features are built), Kiro MUST:

1. **Review the code just written** for refactoring opportunities
2. **Remind Raj** about any tech debt accumulated
3. **Suggest optimisations** for scalability, reliability, and maintainability

## What to Check After Every Build

### Constants & Magic Strings
- Any string used in 3+ places → suggest extracting to a constant
- Example: `'swf-uid'`, `'scbAchievements'`, API URLs, localStorage keys
- Prompt: "I noticed `'swf-uid'` is used in X places — want me to extract it to a `STORAGE_KEYS` constant?"

### Code Duplication
- Same logic in 2+ files → suggest extracting to `src/lib/`
- Same HTML pattern in 3+ pages → suggest an Astro component
- Same fetch+error pattern → suggest a utility function

### Inline Script Size
- Any `<script is:inline>` over 150 lines → suggest extracting to `src/lib/<feature>.ts`
- Activities page is currently 200+ lines of inline JS — flag for extraction

### Performance
- Unnecessary re-fetches → suggest caching with localStorage + TTL
- Large lists without pagination → suggest LIMIT/OFFSET
- Images without lazy loading → add `loading="lazy"`
- Scripts that block render → suggest `defer` or moving to bottom

### Scalability Concerns
- SELECT * without LIMIT → will fail at scale
- Unbounded localStorage writes → could hit 5MB browser limit
- API endpoints without rate limiting → note for future (Cloudflare has built-in)
- Base64 file storage in D1 → flag for R2 migration when enabled

### Reliability
- fetch() without .catch() → always add error handling
- DOM queries without null checks → add guards
- Hardcoded dates/IDs → parameterize

## When to Remind

1. **End of every feature build** — quick scan of what was just written
2. **Start of every new session** — "Hey Raj, quick tech debt update: X, Y, Z from last session"
3. **Before every deploy** — "Build passes. Quick refactor note: consider extracting X"

## Current Tech Debt Register

| # | Item | Workspace | Priority | Status |
|---|------|-----------|----------|--------|
| 1 | Extract shared header into component (Layout + BlogLayout duplicate) | SWF | Medium | ✅ Component created (16Jun2026), swap pending |
| 2 | Upgrade Playwright 1.52 → 1.60 | SWF | Low | ✅ Done (16Jun2026) |
| 3 | Extract `activities.astro` inline JS (200+ lines) into `src/lib/activities.ts` | SWF | Medium | ✅ Done (refactored to 5 components, 15Jun2026) |
| 4 | Extract localStorage key constants (swf-uid, scbAchievements, etc.) | SWF | Low | Open |
| 5 | Add LIMIT to all SELECT queries that could grow unbounded | All | Medium | ✅ Done (16Jun2026) |
| 6 | Migrate pg file storage from D1 base64 to R2 when enabled | PG | Low | Blocked (R2 not enabled) |
| 7 | Add error boundaries to all admin pages (try/catch around fetch) | All | Low | Open |
| 8 | BlogLayout → use Header.astro component (stale nav copy) | SWF | High | Planned (post-credits) |
| 9 | Remove duplicate click tracker in Layout.astro (double-counting) | SWF | Medium | Planned (post-credits) |
| 10 | Extract shared theme toggle script (duped in Layout + BlogLayout) | SWF | Medium | Planned (post-credits) |
| 11 | Extract `json()` helper to `src/lib/api-helpers.ts` (10+ files) | SWF | Low | Planned (post-credits) |
| 12 | Shared email-sender utility (contact + suggest 70% identical) | SWF | Low | Planned (post-credits) |
| 13 | Extract Footer component (differs between Layout + BlogLayout) | SWF | Low | Planned (post-credits) |
| 14 | Dynamic search index (hardcoded PAGES array, stale) | SWF | Low | Planned (post-credits) |
| 15 | Remove stale `swf-admin-auth-reminder` steering (auth exists) | SWF | Note | Planned |
| 16 | GSC API integration for automated seo_index sync (when traffic grows) | SWF | Low | Deferred — revisit when daily traffic exceeds 500 sessions |

## How to Update This File

After fixing tech debt, update the status to "Done" with the date:
```
| 1 | Extract shared header | SWF | Medium | ✅ Done (16Jun2026) |
```

After identifying new debt, append to the table.

## Refactor Commands

Say any of these to trigger a refactor pass:
- "Refactor check" — scan current workspace for issues
- "Tech debt" — show the current register
- "Spring Clean" — full refactor pass + fix top 3 items
