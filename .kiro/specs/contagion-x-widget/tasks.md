# Tasks: X.com Timeline Widget — Contagion Tracker

## Task 1: Add X Timeline panel HTML structure
Add the "Live from X" panel HTML between the Breaking News panel and Disease Info panel in `contagion.astro`. Includes the panel container, header with X logo, profile label, "Open on X" link, loading skeleton, and fallback message.

- [x] Insert new panel HTML after the `#breaking-news-panel` closing div and before `#disease-info`
- [x] Panel uses same card styling as existing panels (rounded-xl, border, shadow-sm)
- [x] Header shows X logo SVG, "Live from X" title, profile label span, and external link
- [x] Container has min-height 200px, max-height 500px with overflow-y auto
- [x] Loading skeleton with spinner animation included
- [x] Fallback div (hidden by default) with "View on X.com" button

## Task 2: Add widgets.js loader and timeline rendering logic
Add the JavaScript logic to load the X widgets.js script (async, once) and the `renderXTimeline()` function that creates/destroys timelines using `twttr.widgets.createTimeline()`.

- [x] Define `xTimelineUrls` mapping object (covid, ebola, hantavirus → X profile URLs)
- [x] Implement `loadWidgetsScript()` — loads widgets.js once, returns promise, handles timeout (10s) and blocked script errors
- [x] Implement `renderXTimeline(disease)` — updates header links, removes existing iframe, creates new timeline with theme/chrome/linkColor options
- [x] On success: hides loading skeleton, renders timeline iframe
- [x] On failure: hides loading, shows fallback with direct link
- [x] Pass `dnt: true` for Do Not Track compliance

## Task 3: Integrate with tab switching and initial load
Wire the `renderXTimeline()` call into the existing disease tab click handlers and the initial page load sequence.

- [x] Add `renderXTimeline(activeDisease)` call inside the existing `.disease-tab` click handler (after `loadBreakingNews()`)
- [x] Call `renderXTimeline(activeDisease)` on initial page load (after `loadData()`)
- [x] Add MutationObserver on `document.documentElement` class attribute to re-render on dark/light mode toggle

## Task 4: Verify build and test locally
Ensure the page builds without errors, renders the X panel, handles blocked scripts gracefully, and the tab switching updates the widget.

- [x] Run `npm run build` — no TypeScript or Astro errors
- [x] Verify panel appears between Breaking News and Disease Info in browser
- [x] Test tab switching updates the profile label and link
- [x] Test with widgets.js blocked (DevTools network block) — fallback message appears
- [x] Verify no layout shift (min-height prevents jump)
