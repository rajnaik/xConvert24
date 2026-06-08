# FreshClicks — Purge & Repopulate ClicksAnalysis on Dev

When asked to "FreshClicks" or refresh the clicks analysis data on dev, follow these steps:

## Steps

1. **Purge the dev ClicksAnalysis table:**

```bash
npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc --command "DELETE FROM ClicksAnalysis;"
```

2. **Copy over from live:** Export all rows from the live ClicksAnalysis table and insert them into dev:

```bash
npx wrangler d1 execute xconvert24-bugs --remote --command "SELECT ip_address, click_count, latitude, longitude, city, country, last_seen FROM ClicksAnalysis;" --json
```

Then insert those rows into dev:

```bash
npx wrangler d1 execute BUGS_DB --remote --config wrangler.dev.jsonc --command "INSERT INTO ClicksAnalysis (ip_address, click_count, latitude, longitude, city, country, last_seen) VALUES (...), ...;"
```

## Notes

- Geo columns (`latitude`, `longitude`, `city`, `country`) are not populated by this process — they require a separate geocoding step.
- The live clicks table schema: `id, user_id, ui_element, created_at, url, ip_address`
- The ClicksAnalysis table schema: `id, ip_address, click_count, latitude, longitude, city, country, last_seen`
- This only refreshes **dev**. Do not write to staging or live ClicksAnalysis from this command.
