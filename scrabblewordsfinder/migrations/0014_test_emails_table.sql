-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0014: Create test_emails table for end-to-end email verification
-- Email Worker stores incoming test emails here; Playwright tests poll for them
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS test_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unique_id TEXT NOT NULL,
  from_address TEXT DEFAULT '',
  to_address TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  body TEXT DEFAULT '',
  received_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_test_emails_uid ON test_emails(unique_id);
