CREATE TABLE IF NOT EXISTS campaign_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  website TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  unsubscribe_token TEXT NOT NULL DEFAULT '',
  sent_at TEXT DEFAULT '',
  opened_at TEXT DEFAULT '',
  unsubscribed_at TEXT DEFAULT '',
  campaign_name TEXT DEFAULT 'default',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_email ON campaign_recipients(email);

CREATE TABLE IF NOT EXISTS campaign_unsubscribes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT '',
  unsubscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
