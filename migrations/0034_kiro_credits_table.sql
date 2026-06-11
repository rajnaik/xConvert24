-- Kiro credit usage tracking
CREATE TABLE IF NOT EXISTS kiro_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan TEXT NOT NULL DEFAULT 'free',
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_total INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  percentage_used REAL NOT NULL DEFAULT 0,
  reset_date TEXT DEFAULT NULL,
  raw_text TEXT DEFAULT '',
  scraped_at TEXT NOT NULL DEFAULT (datetime('now'))
);
