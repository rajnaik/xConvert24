# Design: X.com Timeline Widget — Contagion Tracker

## Overview

Embed X.com (Twitter) timeline widgets into the Contagion Tracker page to provide real-time social media news feeds for each tracked disease. The widget section sits between the Breaking News panel and Disease Info panel, updating dynamically when the user switches disease tabs.

## Architecture

### Component Placement

The X Timeline widget is a new HTML section inserted into the existing `contagion.astro` page — no separate Astro component needed since the page is already a monolithic client-side rendered tool.

```
┌─────────────────────────────────┐
│  Header + Disease Tabs          │
├─────────────────────────────────┤
│  Stats Cards (4-grid)           │
├─────────────────────────────────┤
│  Breaking News Panel            │
├─────────────────────────────────┤
│  🆕 Live from X Panel          │  ← NEW SECTION
├─────────────────────────────────┤
│  Disease Info Panel             │
├─────────────────────────────────┤
│  Top Affected Countries         │
├─────────────────────────────────┤
│  Key Facts & Alerts             │
└─────────────────────────────────┘
```

### X Widget Technology

Uses the official **X for Websites** embed system:
1. Load `https://platform.twitter.com/widgets.js` (async, once)
2. Create timelines via `twttr.widgets.createTimeline()` JavaScript API
3. Destroy and recreate on tab switch (no iframe reuse — X doesn't support dynamic URL changes on existing embeds)

### Disease → X Profile Mapping

```typescript
const xTimelineUrls: Record<string, { url: string; label: string }> = {
  covid: { url: 'https://x.com/COVID19Tracking', label: '@COVID19Tracking' },
  ebola: { url: 'https://x.com/Ebola_Updates', label: '@Ebola_Updates' },
  hantavirus: { url: 'https://x.com/HantaVirusol', label: '@HantaVirusol' },
};
```

## Detailed Design

### 1. HTML Structure

```html
<!-- Live from X panel -->
<div id="x-timeline-panel" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 shadow-sm overflow-hidden">
  <div class="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
    <!-- X logo SVG -->
    <svg class="w-4 h-4 text-gray-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
    <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Live from X</h2>
    <span id="x-profile-label" class="text-xs text-amber-600 dark:text-amber-400 font-mono"></span>
    <a id="x-profile-link" href="#" target="_blank" rel="noopener" class="ml-auto text-xs text-gray-400 hover:text-amber-500 transition-colors">
      Open on X ↗
    </a>
  </div>
  <div id="x-timeline-container" class="relative" style="min-height: 200px; max-height: 500px; overflow-y: auto;">
    <!-- Loading skeleton -->
    <div id="x-timeline-loading" class="flex items-center justify-center py-12">
      <div class="animate-pulse flex items-center gap-2 text-sm text-gray-400">
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        Loading X timeline...
      </div>
    </div>
    <!-- Fallback (shown if widgets.js blocked) -->
    <div id="x-timeline-fallback" class="hidden text-center py-8 px-4">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">X timeline couldn't load (possibly blocked by an ad blocker)</p>
      <a id="x-fallback-link" href="#" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
        View on X.com ↗
      </a>
    </div>
  </div>
</div>
```

### 2. Widget Initialization Logic

```typescript
// Load widgets.js once (async, non-blocking)
let twttrReady: Promise<void>;

function loadWidgetsScript(): Promise<void> {
  if (twttrReady) return twttrReady;
  twttrReady = new Promise((resolve, reject) => {
    if ((window as any).twttr?.widgets) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      const checkReady = setInterval(() => {
        if ((window as any).twttr?.widgets) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      setTimeout(() => { clearInterval(checkReady); reject(new Error('timeout')); }, 10000);
    };
    script.onerror = () => reject(new Error('blocked'));
    document.head.appendChild(script);
  });
  return twttrReady;
}
```

### 3. Timeline Rendering

```typescript
async function renderXTimeline(disease: string) {
  const container = document.getElementById('x-timeline-container')!;
  const loading = document.getElementById('x-timeline-loading')!;
  const fallback = document.getElementById('x-timeline-fallback')!;
  const profileLabel = document.getElementById('x-profile-label')!;
  const profileLink = document.getElementById('x-profile-link')! as HTMLAnchorElement;
  const fallbackLink = document.getElementById('x-fallback-link')! as HTMLAnchorElement;

  const config = xTimelineUrls[disease];
  if (!config) {
    container.innerHTML = '<p class="text-sm text-gray-400 text-center py-8">No X feed configured for this disease.</p>';
    return;
  }

  // Update header links
  profileLabel.textContent = config.label;
  profileLink.href = config.url;
  fallbackLink.href = config.url;

  // Show loading, hide fallback
  loading.classList.remove('hidden');
  fallback.classList.add('hidden');

  // Remove existing embed
  const existingIframe = container.querySelector('iframe');
  if (existingIframe) existingIframe.remove();
  const existingAnchor = container.querySelector('.twitter-timeline');
  if (existingAnchor) existingAnchor.remove();

  try {
    await loadWidgetsScript();
    loading.classList.add('hidden');

    const isDark = document.documentElement.classList.contains('dark');
    const twttr = (window as any).twttr;

    await twttr.widgets.createTimeline(
      { sourceType: 'url', url: config.url },
      container,
      {
        height: 500,
        theme: isDark ? 'dark' : 'light',
        chrome: 'noheader nofooter noborders transparent',
        linkColor: '#d97706',
        dnt: true,
      }
    );
  } catch {
    loading.classList.add('hidden');
    fallback.classList.remove('hidden');
  }
}
```

### 4. Integration with Tab Switching

The existing tab click handler gains one additional call:

```typescript
document.querySelectorAll('.disease-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    activeDisease = (btn as HTMLElement).dataset.disease!;
    updateTabStyles();
    loadData();
    loadBreakingNews();
    renderXTimeline(activeDisease); // ← NEW
  });
});

// Initial load
loadData();
renderXTimeline(activeDisease);
```

### 5. Theme Responsiveness

Re-render the widget when dark/light mode changes:

```typescript
const observer = new MutationObserver(() => {
  renderXTimeline(activeDisease);
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
```

### 6. Performance Considerations

| Concern | Mitigation |
|---------|-----------|
| Initial page load blocked | `widgets.js` loaded async, widget renders AFTER contagion data |
| Multiple iframes on tab switch | Previous iframe removed before creating new one |
| Ad blocker blocking widgets.js | Fallback UI with direct link to X profile |
| Dark/light mode mismatch | Theme param passed on creation; re-renders on toggle |
| Page scroll jump | Container has `min-height: 200px` to prevent layout shift |

### 7. Error States

| State | Display |
|-------|---------|
| Loading | Spinner + "Loading X timeline..." |
| Blocked by ad blocker | Fallback message + "View on X.com ↗" button |
| Profile doesn't exist / empty | X's own "no posts" message inside iframe |
| No config for disease | "No X feed configured for this disease." |

## File Changes

| File | Change |
|------|--------|
| `src/pages/tools/contagion.astro` | Insert X panel HTML between Breaking News and Disease Info + add JS logic |

No new files, API endpoints, or database changes required. Pure client-side enhancement.

## Dependencies

- **External**: `https://platform.twitter.com/widgets.js` (loaded at runtime, no npm package)
- **No new npm packages** required

## Security

- `dnt: true` passed to widget (Do Not Track signal)
- External script from official `platform.twitter.com` domain only
- No user data sent to X — read-only public content embed
- `rel="noopener"` on all external links

## Accessibility

- X logo SVG has `aria-hidden="true"` (decorative)
- "Open on X" link is descriptive
- Loading state includes text content (not just a spinner)
- Fallback provides a clickable alternative when widget can't render
- Container scrollable with proper overflow handling
