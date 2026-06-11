# SWF (ScrabbleWordsFinder) — Brand Keywords

These keywords define the core value proposition of ScrabbleWordsFinder.com. Use them across marketing copy, page descriptions, meta tags, and feature descriptions.

## Core Keywords

- **Realtime** — results appear as you type, no page reloads, no waiting
- **Automatic** — tile probability, rack leave, and best openers update without user action
- **No-signup** — zero account creation, no email, no password, no friction
- **Free** — no premium tiers, no per-day limits, no paywalls, free forever
- **Instant** — sub-second response times, dictionary loaded client-side

## Messaging Theme

Everything happens in realtime, at your fingertips. When you solve a word, you don't just get results — you get ALL the information you need in one place:
- Best words ranked by score
- Tile probability for what's left in the bag
- Rack leave quality analysis
- Best opening moves with double-word scoring
- One-click save with auto-fetched definitions

All of this updates automatically as you type. No buttons to click for secondary information. No separate pages to visit. Everything is right there, instantly.

## Use These Keywords In

- Homepage hero copy
- Disclaimer page (emphasising the free/instant/no-signup nature)
- About page (our promise section)
- Privacy page (no-signup = no personal data collected)
- Meta descriptions across all pages
- Blog CTAs
- **Banner descriptions** (see below)

## Banner Ad-Words (SEO in Rotation Pool)

The `banners` table in D1 stores a `description` field for each of the 10 hero banners. Each description includes a pipe-separated ad-word suffix using core brand keywords. When running SEO steering commands (SEOImprove, CheckSeoHealth, xPolinate, Metadesc, Full Throttle, etc.), also review and refresh these banner ad-words to align with the latest keyword strategy.

Current format: `"Visual description | Ad-word phrase"`

Example:
- Banner 1: `"Classic — board left, title center, scattered tiles right | Free word finder tool"`
- Banner 5: `"Rack focus — tiles inside glass, rack at bottom with holder | Realtime Scrabble aid"`

To update banner ad-words:
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder
npx wrangler d1 execute DB --remote --command "UPDATE banners SET description = 'New description | New ad-word' WHERE option_number = N;"
```

Ensure ad-words rotate the core keywords: Free, Realtime, Instant, No-signup, Automatic.
