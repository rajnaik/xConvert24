# Email Guide — Standards for Email Features

Guidelines for implementing email functionality across all projects.

## Email Architecture

| Component | Purpose |
|-----------|---------|
| Cloudflare Email Service | Send outbound emails via `EMAIL` binding |
| `SWF_NOTIFY_EMAIL` secret | Destination email (never hardcoded in source) |
| Email Routing rules | Receive inbound emails (contact@, support@, info@) |
| `emails` DB table | Persistent record of all submissions |

## Rules

### 1. Never Hardcode Email Addresses
- Store destination in Worker secrets (`wrangler secret put`)
- Reference via `(env as any).SWF_NOTIFY_EMAIL` or similar
- Never expose personal Gmail in HTML, source code, or config files

### 2. Always Save to Database
- Every form submission (contact, suggest, bug report) MUST save to the `emails` table
- Save BEFORE attempting email send (so data isn't lost if email fails)
- Fields: category, name, email, subject, message, ip_address, created_at

### 3. Email Subject Format
- Contact: `[SWF Contact] <Subject Category> from <Name>`
- Suggest: `[SWF Suggestion] from <Name>`
- Bug: `[SWF Bug] from <Name>`
- Never include full user message in subject line

### 4. Email Body Format
```
From: <Name>
Reply-to: <User Email>
Subject: <Category>

<Message body>

---
Sent via <Site>.com <form type> form
IP: <cf-connecting-ip>
```

### 5. Error Handling
- Email send wrapped in try/catch — never fail the HTTP request if email fails
- Log email errors to the `emails` table comment field
- User always gets success response if DB save worked (email is best-effort)

### 6. Data Integrity
- DB `emails.subject` stores the MAPPED subject (e.g., "Bug Report" not "bug")
- DB `emails.category` is always "contact" or "suggest"
- DB `emails.read` defaults to 0, `actioned` defaults to 0
- IP captured server-side from `cf-connecting-ip` header

### 7. Subject Category Mapping
```
general  → "General Question"
bug      → "Bug Report"
feature  → "Feature Suggestion"
privacy  → "Privacy / Data"
other    → "Other"
```

### 8. Admin CRUD
- `/api/emails` — GET (list, filter by category/read), PUT (update comment/read/actioned), DELETE
- `/admin/emails` — table view with edit modal showing ALL fields
- Mark as read, add comments, mark actioned (sets date_actioned)

### 9. Testing
- E2E test: submit form → check `/api/emails` for matching record
- Verify all fields match between form input and DB record
- Use `[SWF-TEST-<uniqueId>]` in message for test identification
- Test all subject mappings
- Verify required columns exist in response

### 10. Routing Rules (Cloudflare Dashboard)
- `contact@domain` → forwards to Gmail
- `support@domain` → forwards to Gmail
- `info@domain` → forwards to Gmail
- `noreply@domain` → used as FROM address (no forwarding needed)

### 11. Privacy
- Email addresses entered by users are stored in DB (disclosed in privacy policy)
- Anonymous tracking disclosures mention we collect form submissions
- Cookie consent does NOT affect form submissions (they work without cookies)

## Email Tables Schema

```sql
CREATE TABLE emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT 'contact',
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  read INTEGER NOT NULL DEFAULT 0,
  actioned INTEGER NOT NULL DEFAULT 0,
  date_actioned TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Applies To
- ScrabbleWordsFinder.com
- xConvert24.com (when ported)
- Any future projects with email features
