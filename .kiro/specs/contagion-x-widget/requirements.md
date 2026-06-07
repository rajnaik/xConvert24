# X.com Timeline Widget — Contagion Tracker

## Overview

Embed X.com (formerly Twitter) timeline widgets into the Contagion Tracker page (`/tools/contagion`) to provide real-time social media news feeds for each tracked disease. Each disease tab will show a live-updating X timeline from a curated disease-specific account.

## Requirements

### REQ-1: X Timeline Widget Section
**Description:** Add a new panel/section to the contagion tracker page that displays an embedded X.com timeline widget, positioned below the existing "Breaking News" panel and above the "Disease Info" panel.

**Acceptance Criteria:**
- [ ] A new section titled "Live from X" (or similar) appears on the contagion page
- [ ] The section uses the same card/panel styling as existing sections (rounded-xl, border, shadow-sm)
- [ ] The widget renders using the official X for Websites embedded timeline (`<a class="twitter-timeline" ...>` + `widgets.js`)
- [ ] The section includes an X logo/icon and a header indicating the source

### REQ-2: Disease-Specific Timeline URLs
**Description:** Each disease tab maps to a different X.com profile URL so the widget shows relevant content when the user switches diseases.

| Disease | X.com Profile URL |
|---------|-------------------|
| Ebola | https://x.com/Ebola_Updates |
| COVID-19 | https://x.com/COVID19Tracking |
| Hantavirus | https://x.com/HantaVirusol/with_replies |

**Acceptance Criteria:**
- [ ] Switching the disease tab at the top updates the X timeline widget to the corresponding profile
- [ ] The widget reloads/re-renders with the new profile URL on tab change
- [ ] If no X URL is configured for a disease, the section shows a graceful fallback message

### REQ-3: Widget Rendering via Official X for Websites JS
**Description:** Use the official X embedded timeline approach — load `https://platform.twitter.com/widgets.js` and use `<a class="twitter-timeline">` anchor elements or `twttr.widgets.createTimeline()` JS API.

**Acceptance Criteria:**
- [ ] The `widgets.js` script is loaded once (async, deferred) on the page
- [ ] Timeline renders inside a defined container element
- [ ] On disease tab switch, the old widget is destroyed and a new one created via `twttr.widgets.createTimeline()`
- [ ] Dark/light theme is respected (pass `theme: 'dark'` or `'light'` matching the site's current theme)

### REQ-4: Widget Configuration & Styling
**Description:** The embedded widget should be visually consistent with the page and have sensible defaults.

**Acceptance Criteria:**
- [ ] Widget height is capped (e.g., 500px) to avoid page sprawl
- [ ] Widget width is responsive (100% of container)
- [ ] Chrome (header, footer, borders) is set to `noheader nofooter noborders` for cleaner integration
- [ ] Link color matches the site's amber accent (`#d97706`)
- [ ] The widget respects the user's dark/light mode preference

### REQ-5: Graceful Loading & Error States
**Description:** Handle slow loads, blocked scripts (ad blockers), and missing timelines gracefully.

**Acceptance Criteria:**
- [ ] A loading skeleton/spinner is shown while the widget loads
- [ ] If `widgets.js` fails to load (e.g., ad blocker), show a fallback message with a direct link to the X profile
- [ ] If the timeline is empty or the account doesn't exist, show a "No posts available" message

### REQ-6: Performance — Lazy Loading
**Description:** The X widget script and timeline should not block initial page render or slow down the contagion data loading.

**Acceptance Criteria:**
- [ ] `widgets.js` is loaded with `async` attribute
- [ ] Widget initialization happens after the main contagion data has loaded
- [ ] The widget section uses a loading placeholder until the script is ready

## Out of Scope

- Server-side caching or proxying of X content
- Custom styling beyond what X's embed parameters allow
- Authentication with X API (the embed widget is public, no API key needed)
- Moderation or filtering of posts within the timeline

## Notes

- **Pinned tweets:** The top post in a timeline may be a pinned (old) tweet. The widget will display whatever X serves — users should scroll past any pinned post to see the latest updates. Consider adding a small UI hint like "Scroll for latest posts" if the widget supports it.
- **Hantavirus uses `/with_replies`** — this ensures we get maximum content from the `@HantaVirusol` account since it's a niche topic with less frequent posting.

## Resolved Questions

1. ✅ COVID-19 → `https://x.com/COVID19Tracking`
2. ✅ Hantavirus → `https://x.com/HantaVirusol/with_replies`
3. Collapsible section — not required for v1 (can add later if needed)
