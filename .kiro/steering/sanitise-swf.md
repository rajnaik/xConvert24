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

### 5. Consistency Check
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

2. **Fix any findings** — replace or remove the sensitive/incorrect content
3. **Run automated tests:**
```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx playwright test tests/sanitise.spec.ts --reporter=list
```
4. **Report results**

## Trigger

- Automatically after every build/deploy (via post-build-sanitise hook)
- Manually via "Sanitise SWF"

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
