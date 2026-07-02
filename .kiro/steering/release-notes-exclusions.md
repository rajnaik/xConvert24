# Release Notes Exclusions — Tracking & Surveillance Never Public

## Rule

The following feature categories MUST NEVER appear in the public release notes (`/releases/` page), changelogs, or any user-facing documentation. **No exceptions. No greenlight possible.**

## Permanently Excluded (NEVER announce)

### User Tracking & Data Storage
- Click tracking, click analytics, banner click tracking
- Session tracking, heartbeat tracking, visitor monitoring
- IP address collection, geolocation, user agent logging
- UUID tracking, fingerprinting, telemetry
- The `clicks` table, `banner_clicks` table, `ClicksAnalysis` table
- Any mention of storing user details, tracking users, monitoring visitors
- Real-time visitor sessions, live session monitoring
- Any `/admin/clicks`, `/admin/telemetry` infrastructure
- Cookie consent implementation details (the mechanism itself is fine to mention, but NOT what data it enables)

### Internal Admin Infrastructure
- Anything in `/admin/` that reveals what data we collect
- Ops console, click dashboards, monitoring tools
- Email storage (`emails` table internals)
- Any admin-only analytics or reporting features

## Temporarily Excluded (until Raj says "announce")

These CAN appear in release notes once Raj explicitly greenlights them:

### Avatar & Identity System
- User registration, avatar assignment, display names
- Avatar swap, avatar collage, Scrabble-flavoured naming
- Player profiles, anonymous identity system

### Multiplayer & Games
- Daily Duel, Word Clash, Word Chain, Word Poker
- Matchmaking, leaderboards, scoring, competitive features

### AI Intelligence Upgrades (Lex)
- Model routing, rack quality scoring, training modes
- Post-game analysis, chat improvements

## What This Means

1. **Permanently excluded items** — NEVER include, regardless of what Raj says. These are privacy-sensitive.
2. **Temporarily excluded items** — skip until Raj says "announce [feature]"
3. Use generic descriptions if infrastructure work must be mentioned: "Backend improvements", "Performance optimisations", "Internal tooling updates"
4. When running Sanitise SWF, **flag** any release notes that mention permanently excluded topics

## Grep Check for Sanitise

```bash
# Permanently excluded — always flag
grep -ni "click track\|click analyt\|session track\|user track\|visitor track\|heartbeat\|live session\|IP address\|geolocation\|user agent\|fingerprint\|UUID track\|banner.*click.*track\|telemetry\|monitor.*visitor\|visitor monitor\|real-time visitor\|storing.*user\|user.*detail\|collect.*data" src/pages/releases.astro

# Temporarily excluded — flag unless greenlighted
grep -ni "avatar\|multiplayer\|daily duel\|word clash\|leaderboard\|matchmak\|elo\|display name\|player.*identity\|anonymous.*profile\|user.*register\|training mode\|rack quality\|model routing" src/pages/releases.astro
```

If permanent matches found — remove immediately. No discussion.

## Agent Attribution

This is a **kiro** steering rule, created July 2, 2026.
