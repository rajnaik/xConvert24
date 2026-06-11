# FreshClicks SWF — Purge & Hydrate Local Clicks from Live

When asked to "FreshClicks SWF" or refresh SWF clicks data on local dev, follow these steps:

## Steps

1. **Purge the local clicks table:**

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx wrangler d1 execute DB --local --command "DELETE FROM clicks;"
```

2. **Export from live:**

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx wrangler d1 execute DB --remote --command "SELECT user_id, ui_element, url, ip_address, created_at FROM clicks ORDER BY id DESC LIMIT 500;" --json
```

3. **Insert into local:** Take the JSON results and build INSERT statements:

```bash
cd /Users/rajeevnaik/Code/xConvert.com/scrabblewordsfinder && npx wrangler d1 execute DB --local --command "INSERT INTO clicks (user_id, ui_element, url, ip_address, created_at) VALUES (...), ...;"
```

4. **(Optional) Also sync banner_clicks:**

```bash
npx wrangler d1 execute DB --local --command "DELETE FROM banner_clicks;"
npx wrangler d1 execute DB --remote --command "SELECT banner_id, ip_address, user_agent, referrer, page_url, created_at FROM banner_clicks ORDER BY id DESC LIMIT 200;" --json
# Then insert into local
```

## Notes

- Only refreshes LOCAL dev. Does not touch staging or live.
- Limits to last 500 clicks to keep local DB lean.
- The `clicks` table schema: `id, user_id, ui_element, url, ip_address, created_at`
- The `banner_clicks` schema: `id, banner_id, ip_address, user_agent, referrer, page_url, created_at`

## Agent Attribution

This is a **kiro** command for AuditLog purposes.
