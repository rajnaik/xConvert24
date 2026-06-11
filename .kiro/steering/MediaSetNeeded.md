# MediaSetNeeded — Chrome Extension Release Media Checklist

All media assets required for a Chrome Web Store submission.

## Required Media

| # | Asset | Dimensions | Format | Status |
|---|-------|-----------|--------|--------|
| 1 | **Extension Icon (small)** | 48×48 | PNG | ✅ Done |
| 2 | **Extension Icon (large)** | 128×128 | PNG | ✅ Done |
| 3 | **Screenshot 1** | 1280×800 or 640×400 | PNG/JPEG | ✅ Have (popup idle state) |
| 4 | **Screenshot 2** | 1280×800 or 640×400 | PNG/JPEG | TODO (test success - green) |
| 5 | **Screenshot 3** | 1280×800 or 640×400 | PNG/JPEG | TODO (countdown running) |
| 6 | **Small promo tile** | 440×280 | JPEG or 24-bit PNG (no alpha) | TODO |
| 7 | **Marquee promo tile** | 1400×560 | JPEG or 24-bit PNG (no alpha) | TODO |

## Optional Media

| # | Asset | Dimensions | Format | Notes |
|---|-------|-----------|--------|-------|
| 8 | YouTube video | - | URL | Demo video of extension in action |
| 9 | Screenshot 4-5 | 1280×800 | PNG/JPEG | Additional states (saved items, error) |

## Promo Tile Design Guidelines

- **Small (440×280):** Show extension name + icon + one-liner tagline. Dark bg, clean text.
- **Marquee (1400×560):** Extension name + icon + screenshot preview + key features. Used on featured spots.

## For Each Extension Release

Run this checklist before submission:
1. ✅ Icons (48 + 128 PNG)
2. ✅ At least 1 screenshot
3. ✅ Small promo tile (440×280)
4. ✅ Marquee promo tile (1400×560)
5. ✅ Store description + privacy policy URL
6. ✅ Zip file (no tests, no dev files)


## Privacy Practices — Chrome Web Store Submission

### User Data Collection

For the Auto Button Clicker (and similar utility extensions), select **NONE** of the data types:

- [ ] Personally identifiable information
- [ ] Health information
- [ ] Financial and payment information
- [ ] Authentication information
- [ ] Personal communications
- [ ] Location
- [ ] Web history
- [ ] User activity
- [ ] Website content

**None checked** — the extension stores only the user's own CSS selectors and interval preferences locally. No data leaves the browser.

### Certifications (check all three)

- [x] I do not sell or transfer user data to third parties, apart from the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

### Permission Justifications Template

| Permission | Justification |
|-----------|---------------|
| **activeTab** | Required to access the current page's DOM and click the user-specified element. Only activates when the user clicks the extension. |
| **scripting** | Required to inject the auto-click script into the active tab so it can locate and click the target element at the set interval. |
| **storage** | Required to save the user's selectors, interval preferences, and active clicker state locally so settings persist between sessions. |
| **tabs** | Required to read the current tab's URL to detect chrome:// pages (where the extension cannot operate) and show a friendly message. |

### Remote Code

- Does your extension use remote code? **No**

### Single Purpose Description

"Automatically clicks a user-specified web element (identified by CSS selector or ID) at a configurable interval between 1 and 60 seconds."

### Publisher Settings

- Contact email: contact@scrabblewordsfinder.com (must be verified)
