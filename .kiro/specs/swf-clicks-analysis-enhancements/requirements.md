# Requirements Document

## Introduction

Three enhancements to the SWF ecosystem: (1) an interactive map view on the Click Analysis admin page showing user locations from the ClicksAnalysis table, (2) corrected trend/status color mappings on the Coins admin pages so that sentiment severity aligns with color intensity, and (3) ensuring all SWF form submissions (contact and suggest) are saved to the `emails` database table before any email send attempt, following the save-before-send pattern.

## Glossary

- **Click_Analysis_Page**: The SWF admin page at `/admin/clicks-analysis` displaying visual analytics of user click data
- **ClicksAnalysis_Table**: The D1 database table storing aggregated click data per IP address with columns: id, ip_address, click_count, latitude, longitude, city, country, last_seen
- **Map_View**: An interactive map rendered using Leaflet.js with OpenStreetMap tiles showing user location markers
- **Trend_Color_System**: The `getTrendColor(status, trend)` function in the Coins admin pages that maps sentiment labels to CSS hex color values
- **Emails_Table**: The D1 database table storing all form submissions with columns: id, category, name, email, subject, message, ip_address, comment, read, actioned, date_actioned, created_at
- **Contact_API**: The SWF endpoint at `/api/contact` that processes contact form submissions
- **Suggest_API**: The SWF endpoint at `/api/suggest` that processes feature suggestion submissions
- **Save_Before_Send**: The pattern where form data is persisted to the database before attempting email delivery, ensuring data integrity even if email fails
- **Geo_Enrichment**: The process of resolving an IP address to latitude, longitude, city, and country coordinates
- **Sentiment_Color_Scale**: A five-tier color mapping from very negative (red) through neutral (gray) to very positive (bright green)

## Requirements

### Requirement 1: Map View Button on Click Analysis Page

**User Story:** As an admin, I want to view all unique user locations on an interactive map, so that I can visualize the geographic distribution of site visitors.

#### Acceptance Criteria

1. WHEN the admin clicks the "Map View" button on the Click Analysis page, THE Click_Analysis_Page SHALL display an interactive map overlay occupying the full width of the content area and a minimum height of 500px, showing all unique user locations from the ClicksAnalysis_Table
2. WHILE the Map_View is displayed, THE Map_View SHALL render each unique user location as a marker positioned at the latitude and longitude coordinates stored in the ClicksAnalysis_Table
3. THE Map_View SHALL use Leaflet.js with OpenStreetMap tiles to render the interactive map without requiring an API key
4. WHEN a marker is clicked or hovered, THE Map_View SHALL display a tooltip showing the city, country, click count, and last seen date (formatted as YYYY-MM-DD) for that location
5. THE Map_View SHALL only display markers for rows where both latitude and longitude values are non-null, non-zero, and within valid geographic ranges (latitude between -90 and 90, longitude between -180 and 180)
6. THE Click_Analysis_Page SHALL include a "Map View" button in the view switcher bar alongside the existing bubble chart view buttons (By Element, By Page, By Country, By Device, By Browser)
7. WHEN the map is displayed with one or more markers, THE Map_View SHALL auto-fit the map bounds to encompass all visible markers with padding so no marker touches the map edge
8. WHILE the map is zoomed out, THE Map_View SHALL cluster nearby markers using Leaflet.markercluster default clustering radius, displaying the count of grouped markers on each cluster icon
9. IF no rows in the ClicksAnalysis_Table have valid latitude and longitude values, THEN THE Map_View SHALL display a centered message indicating that no location data is available
10. WHEN the admin clicks the "Map View" button again or clicks a different view switcher button, THE Click_Analysis_Page SHALL hide the map overlay and display the selected view

### Requirement 2: Geo-Enrichment of ClicksAnalysis Records

**User Story:** As an admin, I want IP addresses in the ClicksAnalysis table to be resolved to geographic coordinates, so that the map view can display meaningful location data.

#### Acceptance Criteria

1. WHEN the Geo_Enrichment process runs, THE Geo_Enrichment process SHALL resolve the IP address to latitude, longitude, city, and country values for all rows in the ClicksAnalysis_Table that have a non-empty ip_address and null latitude
2. THE Geo_Enrichment process SHALL update each processed ClicksAnalysis_Table row with the resolved latitude (decimal, at least 4 decimal places of precision), longitude (decimal, at least 4 decimal places of precision), city (string), and country (string)
3. IF the Geo_Enrichment lookup fails, times out after 5 seconds per IP, or returns no result for a given IP address, THEN THE system SHALL leave the latitude, longitude, city, and country fields as null for that row without failing the enrichment of remaining rows or the overall click aggregation process
4. THE Geo_Enrichment process SHALL skip private/reserved IP addresses (127.x.x.x, 10.x.x.x, 192.168.x.x, 172.16-31.x.x) and leave their geo fields as null
5. THE Geo_Enrichment process SHALL process a maximum of 50 un-enriched IP addresses per execution cycle to avoid exceeding rate limits or causing excessive processing time

### Requirement 3: Trend and Status Color Sentiment Alignment

**User Story:** As an admin, I want trend and status colors on the Coins pages to accurately reflect sentiment severity, so that I can quickly assess coin health at a glance.

#### Acceptance Criteria

1. THE Trend_Color_System SHALL map the following statuses to a dark red color indicating critical severity: "crashing", "dumping hard"
2. THE Trend_Color_System SHALL map the following statuses to a red color indicating very negative severity: "bleeding", "dumping"
3. THE Trend_Color_System SHALL map the following statuses to an orange/amber color indicating negative severity: "falling", "declining", "distributing", "profit taking"
4. THE Trend_Color_System SHALL map the following statuses to a gray/slate color indicating neutral severity: "stable", "sideways", "consolidating"
5. THE Trend_Color_System SHALL map the following statuses to a green color indicating positive severity: "rising", "gaining", "creeping up", "accumulating"
6. THE Trend_Color_System SHALL map the following statuses to a bright green/emerald color indicating very positive severity: "mooning", "pumping hard", "surging", "pumping"
7. THE Trend_Color_System SHALL perform case-insensitive matching when comparing a trend or status value against the defined sentiment categories
8. THE Trend_Color_System SHALL apply the sentiment color to the text element displaying the trend or status value on all Coins admin pages (coins.astro, tracker.astro, analysis.astro)
9. IF the Trend_Color_System receives a status or trend value that does not match any of the defined sentiment categories, THEN THE Trend_Color_System SHALL display the value using the neutral gray/slate color

### Requirement 4: Contact Form Saves to Emails Table Before Send

**User Story:** As an admin, I want every contact form submission saved to the emails table before the email send attempt, so that no submission is lost even if email delivery fails.

#### Acceptance Criteria

1. WHEN a valid contact form submission is received (where the message field is non-empty after trimming whitespace), THE Contact_API SHALL insert a row into the Emails_Table before attempting to send the notification email
2. THE Contact_API SHALL store the following fields in the Emails_Table: category as "contact", name, email, mapped subject (using the subject category mapping), message, and ip_address from the cf-connecting-ip header
3. IF the email send fails after the database save, THEN THE Contact_API SHALL update the Emails_Table row comment field with the error message text (truncated to 500 characters if longer)
4. WHEN the database save succeeds, THE Contact_API SHALL return an HTTP 200 response with a JSON body containing an "ok" field set to true, regardless of whether the email send succeeds or fails
5. IF the database save fails, THEN THE Contact_API SHALL return a JSON error response with HTTP status 500 containing an error field indicating the failure reason
6. IF the message field is missing or empty after trimming, THEN THE Contact_API SHALL return a JSON error response with HTTP status 400 containing an error field indicating that the message is required
7. IF neither the database binding nor the email binding is available, THEN THE Contact_API SHALL return a JSON error response with HTTP status 503 indicating that the service is unavailable

### Requirement 5: Suggest Form Saves to Emails Table Before Send

**User Story:** As an admin, I want every suggestion form submission saved to the emails table before the email send attempt, so that no suggestion is lost even if email delivery fails.

#### Acceptance Criteria

1. WHEN a suggest form submission is received with a non-empty suggestion field (after trimming whitespace), THE Suggest_API SHALL insert a row into the Emails_Table before attempting to send the notification email
2. THE Suggest_API SHALL store the following fields in the Emails_Table: category as "suggest", name (from form input, defaulting to empty string if not provided), email (from form input, defaulting to empty string if not provided), subject as "Feature Suggestion", message (the trimmed suggestion text), and ip_address from the cf-connecting-ip header (defaulting to empty string if header is absent)
3. IF the email send fails after the database save, THEN THE Suggest_API SHALL update the Emails_Table row comment field with the error message, truncated to 500 characters if the error exceeds that length
4. WHEN the database save to the Emails_Table succeeds, THE Suggest_API SHALL return a JSON response with status 200 and body containing `{ "ok": true }`, regardless of whether the subsequent email send succeeds or fails
5. IF the database save fails, THEN THE Suggest_API SHALL return a JSON error response with status 500 and body containing `{ "ok": false, "error": "<error description>" }`
6. IF the suggestion field is missing or empty after trimming, THEN THE Suggest_API SHALL return a JSON error response with status 400 and body containing `{ "error": "suggestion is required" }` without writing to the Emails_Table or attempting an email send
7. THE Suggest_API SHALL remove the legacy insert into the suggestions table and use the Emails_Table as the single source of truth
