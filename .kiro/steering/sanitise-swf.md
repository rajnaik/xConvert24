# Sanitise SWF — Post-Deploy Content Scan & Data Management Compliance

When asked to "Sanitise SWF" or after a staging deploy, scan all SWF pages for sensitive information, policy violations, and data management compliance.

## What to Check

### 1. Sensitive Data
- Email addresses (especially personal ones)
- Passwords or credential patterns
- API keys (OpenAI sk-*, AWS AKIA*, Cloudflare tokens)
- Employee/developer names (e.g., "rajeev")
- Internal URLs or admin paths exposed on public pages

### 2. Policy Violations
- References to "no ads", "ad-free", "never have ads", "won't advertise"
- Claims of "No Google Analytics" or "no analytics" (we now track anonymous clicks)
- Claims of "no tracking" (we do anonymous click tracking — be honest about it)
- Claims of "no cookies" (we have cookie consent now)

### 3. Google Analytics / Third-Party References
- Any text referencing GA, Google Analytics, GA4 on public pages (except cookie consent code)
- Third-party service names that shouldn't be user-visible

### 4. Data Management Principles
All public-facing pages must comply with these principles:

- **Transparency** — clearly state what anonymous data we collect (clicks, country, device type)
- **No personal data** — never mention collecting emails, names, or identifiable info
- **Purpose limitation** — state data is used only to improve features, never sold
- **User control** — remind users they can nuke localStorage, download backups, relink UUID
- **Honesty** — don't claim "zero tracking" when we track anonymous clicks. Say "privacy-focused" instead
- **Cookie consent** — every page must load the CookieConsent component via Layout
- **No misleading claims** — if we have ads in future, don't say "no ads forever" anywhere

### 5. Visitor Monitoring / Surveillance Language
- Public pages (including release notes, about, blog) must NEVER mention:
  - "visitor monitoring", "real-time visitor", "session tracking", "heartbeat tracking"
  - "monitor users", "track visitors", "user surveillance", "watching users"
  - "live sessions" (in context of monitoring visitors — game sessions are fine)
  - Any language that implies we watch, monitor, or track individual visitors
- Admin-only features (live sessions, click tracking, heartbeat) are internal tools — they should NEVER appear in public-facing copy, changelogs, or release notes
- Acceptable alternatives: "Admin improvements", "Internal tooling updates", "Backend enhancements"
- The grep pattern for this check:
```bash
grep -rn "visitor monitor\|real-time visitor\|session track\|heartbeat.*track\|monitor.*user\|track.*visitor\|user surveil\|watching user\|live session" . --include="*.astro" | grep -v "node_modules\|admin/"
```

### 6. Release Notes Sanitisation
- The `/releases` page must NEVER mention internal admin features as user-facing changes
- Banned terms in release notes specifically:
  - "click tracking", "click analytics", "banner click tracking"
  - "session tracking", "user tracking", "visitor tracking"
  - "heartbeat", "telemetry" (as a feature — OK as internal improvement)
  - "live sessions", "real-time visitor", "IP address", "geolocation"
  - "user agent", "fingerprint", "UUID tracking"
  - Any admin-only infrastructure (click dashboard, ops console, monitoring)
- Acceptable in release notes:
  - Game features: "streak tracking", "activity tracking", "performance tracking", "personal best tracking"
  - User features: "game sessions", "session persistence", "history"
  - Generic: "Admin improvements", "Backend enhancements", "Internal tooling updates"
- Grep pattern for release notes specifically:
```bash
grep -ni "click track\|click analyt\|session track\|user track\|visitor track\|heartbeat\|live session\|IP address\|geolocation\|user agent\|fingerprint\|UUID track\|banner.*click.*track\|telemetry" src/pages/releases.astro | grep -vi "game\|streak\|activity\|personal best\|performance"
```

### 7. Consistency Check
- Privacy page must accurately reflect current data practices
- Disclaimer must not contradict privacy page
- About page claims must match reality
- Terms must cover anonymous data collection

## Steps

1. **Scan all pages:**
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/src/pages
grep -rn "no ads\|ad-free\|never.*ads\|won't.*advertis\|Google Analytics\|GA4\|@gmail\|password\|api.key\|API_KEY\|rajeev\|employee\|no tracking\|no cookies\|zero.*track" . --include="*.astro" | grep -v node_modules
```

2. **Scan for surveillance/monitoring language on public pages:**
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/src/pages
grep -rn "visitor monitor\|real-time visitor\|session track\|heartbeat.*track\|monitor.*user\|track.*visitor\|user surveil\|watching user\|live session" . --include="*.astro" | grep -v "node_modules\|admin/"
```

3. **Scan release notes for internal admin/tracking language:**
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder/src/pages
grep -ni "click track\|click analyt\|session track\|user track\|visitor track\|heartbeat\|live session\|IP address\|geolocation\|user agent\|fingerprint\|UUID track\|banner.*click.*track\|telemetry" releases.astro | grep -vi "game\|streak\|activity\|personal best\|performance"
```

4. **Fix any findings** — replace or remove the sensitive/incorrect content
5. **Run automated tests:**
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx playwright test tests/sanitise.spec.ts --reporter=list
```
6. **Report results**

## Trigger

- Automatically after every build/deploy (via post-build-sanitise hook)
- Manually via "Sanitise SWF"

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
