# Code Principles — Quality Standards for All Workspaces

## Core Principles

1. **Simplicity first** — always choose the simplest solution that works. No over-engineering.
2. **Modular** — every feature should be self-contained and portable between workspaces.
3. **Scalable** — code should handle millions of users without architectural changes.
4. **Fast** — minimize API calls, use caching (localStorage, stale-while-revalidate), lazy load.
5. **Bug-free** — validate inputs, handle errors gracefully, never crash the page.
6. **Maintainable** — readable code > clever code. Future-you should understand it in 6 months.

## Coding Practices

### Constants over magic strings
When a string appears in 2+ places, extract it to a constant. Prompt Raj when you spot this:
```
// BAD
localStorage.getItem('swf-uid')  // used in 10 places
// GOOD  
const STORAGE_KEY_UID = 'swf-uid';
localStorage.getItem(STORAGE_KEY_UID);
```

### DB-driven features
All features that can be toggled should be **database-driven** with a status field:
- `status = 1` → visible/active
- `status = 0` → hidden/disabled
Admin CRUD controls the status. The public page reads from the API.

### Package for porting
Every new feature should be built so it can be ported to other workspaces via `pushFeature`:
- Self-contained API endpoint(s)
- Self-contained UI (page or panel)
- Own migration SQL file
- No hard-coded workspace-specific values (use env vars or config)

### Performance patterns
- **Client-side caching:** localStorage with TTL for data that doesn't change often (WOTD, roadmap)
- **Lazy loading:** Don't fetch data until the panel/section is visible
- **Debounce:** User inputs that trigger API calls should be debounced (300ms min)
- **Pagination:** Never load all rows — use LIMIT/OFFSET for large tables
- **Static where possible:** Use `export const prerender = true` for pages that don't need runtime data

### Error handling
- Every `fetch()` must have a `.catch()` or try/catch
- Show user-friendly messages, never raw errors
- Log errors to console in dev, suppress in production
- API endpoints always return proper HTTP status codes + JSON error bodies

### Naming conventions
- **DB tables:** PascalCase for legacy, snake_case for new (e.g., `roadmap_features`)
- **API routes:** kebab-case (e.g., `/api/roadmap-features`)
- **JS variables:** camelCase
- **CSS classes:** Tailwind utilities (no custom class names unless in `<style>`)
- **Files:** kebab-case (e.g., `roadmap-features.ts`)

### Suggestions to prompt Raj about
When writing code, if you notice:
- A string used in 3+ places → suggest a constant
- An API call without error handling → add it
- A feature that could benefit other workspaces → mention porting
- A page without `prerender = true` that could be static → suggest it
- An inline script over 100 lines → suggest extracting to `src/lib/`

## Applies To
All workspaces: SWF, xConvert, Coins, Playground.
