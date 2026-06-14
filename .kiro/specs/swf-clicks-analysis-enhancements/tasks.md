# Implementation Plan: SWF Clicks Analysis Enhancements

## Overview

Five enhancements across two workspaces: trend color fix (Coins), contact/suggest API refactors (SWF), clicks analysis API + geo-enrichment endpoint (SWF), and an interactive Leaflet.js map view on the clicks-analysis admin page (SWF). Tasks are ordered so independent fixes land first, followed by API layer, then UI that depends on the API.

## Tasks

- [x] 1. Fix Trend Color System (Coins workspace)
  - [x] 1.1 Replace getTrendColor function in coins.astro, tracker.astro, and analysis.astro
    - ⚠️ **COINS WORKSPACE** — requires `Dev Mode coins` before writing
    - Replace the existing `getTrendColor()` function in all three files with the corrected 6-tier sentiment-to-color mapping
    - Tiers: critical→#991b1b, very negative→#dc2626, negative→#f59e0b, neutral→#64748b, positive→#22c55e, very positive→#10b981
    - "consolidating" moves from amber to neutral gray
    - Case-insensitive matching via `.toLowerCase()`
    - Unknown values default to neutral gray
    - Files: `coins/src/pages/admin/coins.astro`, `coins/src/pages/admin/tracker.astro`, `coins/src/pages/admin/analysis.astro`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]* 1.2 Write property tests for getTrendColor
    - **Property 6: Trend color tier mapping correctness**
    - **Property 7: Trend color case insensitivity**
    - **Property 8: Unknown trend values default to neutral**
    - **Validates: Requirements 3.1–3.9**
    - Test file: `coins/tests/trend-color.property.test.ts`
    - Use fast-check to generate random tier labels, case variations, and unknown strings

- [x] 2. Refactor Contact API — save-before-send (SWF workspace)
  - [x] 2.1 Rewrite contact.ts with save-before-send pattern
    - DB INSERT into `emails` table is the PRIMARY operation (category='contact')
    - Email send is SECONDARY and best-effort (wrapped in try/catch)
    - Remove the `suggestions` table fallback path entirely
    - On email failure: UPDATE `emails.comment` with error message (truncated to 500 chars)
    - Return 200 `{ ok: true }` if DB save succeeded, regardless of email outcome
    - Return 500 if DB save fails, 400 if message empty/whitespace, 503 if no DB and no EMAIL binding
    - Preserve test_emails table logic for SWF-TEST pattern
    - File: `scrabblewordsfinder/src/pages/api/contact.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 2.2 Write property tests for Contact API
    - **Property 9: Contact API save-before-send with correct field mapping**
    - **Property 11: Error message truncation in comment field**
    - **Property 12: Successful DB save returns 200 regardless of email outcome**
    - **Property 13: Empty/whitespace input validation returns 400**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
    - Test file: `scrabblewordsfinder/tests/contact-api.property.test.ts`

- [x] 3. Refactor Suggest API — save-before-send (SWF workspace)
  - [x] 3.1 Rewrite suggest.ts with save-before-send pattern
    - DB INSERT into `emails` table is the PRIMARY operation (category='suggest', subject='Feature Suggestion')
    - Remove the INSERT INTO `suggestions` table entirely
    - Email send is SECONDARY and best-effort (wrapped in try/catch)
    - On email failure: UPDATE `emails.comment` with error message (truncated to 500 chars)
    - Return 200 `{ ok: true }` if DB save succeeded, regardless of email outcome
    - Return 500 `{ ok: false, error }` if DB save fails
    - Return 400 if suggestion field is empty/whitespace
    - Fields: category='suggest', name (default ''), email (default ''), subject='Feature Suggestion', message=trimmed suggestion, ip_address from cf-connecting-ip (default '')
    - File: `scrabblewordsfinder/src/pages/api/suggest.ts`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 3.2 Write property tests for Suggest API
    - **Property 10: Suggest API save-before-send with correct field mapping**
    - **Property 11: Error message truncation in comment field**
    - **Property 12: Successful DB save returns 200 regardless of email outcome**
    - **Property 13: Empty/whitespace input validation returns 400**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6**
    - Test file: `scrabblewordsfinder/tests/suggest-api.property.test.ts`

- [x] 4. Checkpoint — API refactors complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Clicks Analysis API endpoint (SWF workspace)
  - [x] 5.1 Create GET /api/clicks-analysis endpoint
    - New file: `scrabblewordsfinder/src/pages/api/clicks-analysis.ts`
    - Query ClicksAnalysis table for rows with valid lat/lng (non-null, non-zero, within -90/90 and -180/180)
    - Return JSON `{ locations: [...] }` with fields: ip_address, click_count, latitude, longitude, city, country, last_seen
    - Use D1 binding `DB`
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 6. Geo-Enrichment API endpoint (SWF workspace)
  - [x] 6.1 Create POST /api/geo-enrich endpoint
    - New file: `scrabblewordsfinder/src/pages/api/geo-enrich.ts`
    - Fetch up to 50 rows from ClicksAnalysis where latitude IS NULL and ip_address is non-empty
    - Filter out private/reserved IPs (127.x, 10.x, 192.168.x, 172.16-31.x) using `isPrivateIP()` helper
    - Batch lookup remaining IPs via POST to `http://ip-api.com/batch` (max 100 per request)
    - Update each successfully resolved row with latitude, longitude, city, country
    - On individual IP failure: leave fields null, continue with remaining IPs
    - Return summary `{ enriched, skipped, failed }` counts
    - 5-second timeout for batch request
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 6.2 Write property tests for geo-enrichment helpers
    - **Property 4: Geo-enrichment failure isolation**
    - **Property 5: Private IP address detection**
    - **Validates: Requirements 2.3, 2.4**
    - Test file: `scrabblewordsfinder/tests/geo-enrich.property.test.ts`
    - Use fast-check to generate random IPs across private/public ranges and random success/fail outcomes

- [x] 7. Map View UI on clicks-analysis page (SWF workspace)
  - [x] 7.1 Add Leaflet.js CDN imports and Map View button to clicks-analysis.astro
    - Add Leaflet 1.9.4 CSS + JS and MarkerCluster 1.5.3 CSS + JS via CDN links
    - Add "Map View" button to the view switcher bar (data-view="map")
    - Add map container div (full width, min-height 500px, hidden by default)
    - Add "No location data available" fallback message element
    - _Requirements: 1.3, 1.6_

  - [x] 7.2 Implement map initialization, marker creation, and view toggling logic
    - Implement `filterValidLocations()` — filters for valid lat/lng ranges, non-null, non-zero
    - Implement `initMap()` — creates Leaflet map with OpenStreetMap tiles
    - Implement `createMarkers()` — uses MarkerClusterGroup, populates from location data
    - Tooltip on click/hover shows city, country, click count, last_seen (YYYY-MM-DD)
    - Auto-fit bounds to encompass all markers with padding
    - View switcher: "Map View" shows map container + hides bubble container; other views reverse
    - Destroy map instance when switching away to free memory
    - Show "No location data available" message if no valid locations returned
    - Fetch data from `/api/clicks-analysis` endpoint
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7, 1.8, 1.9, 1.10_

  - [ ]* 7.3 Write property tests for map view helpers
    - **Property 1: Valid locations produce markers, invalid locations do not**
    - **Property 2: Tooltip contains all required fields in correct format**
    - **Property 3: Map bounds encompass all markers**
    - **Validates: Requirements 1.2, 1.4, 1.5, 1.7**
    - Test file: `scrabblewordsfinder/tests/map-view.property.test.ts`
    - Use fast-check to generate random lat/lng values and LocationData objects

- [x] 8. Final checkpoint — build verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify that `scrabblewordsfinder/` builds cleanly with `npm run build`
  - Verify no TypeScript errors in new/modified files

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Task 1.1 (trend color fix) is in the **Coins workspace** — requires `Dev Mode coins`. All other tasks are in the SWF workspace.
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The geo-enrichment endpoint uses the free ip-api.com service (no API key needed, 15 req/min rate limit)
- Contact and Suggest API refactors remove the legacy `suggestions` table dependency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2", "5.1", "6.1"] },
    { "id": 2, "tasks": ["6.2", "7.1"] },
    { "id": 3, "tasks": ["7.2"] },
    { "id": 4, "tasks": ["7.3"] }
  ]
}
```
