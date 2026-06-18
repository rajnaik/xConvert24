-- Rack History: stores every word submitted in the Daily Rack Challenge
CREATE TABLE IF NOT EXISTS rack_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  meaning TEXT DEFAULT '',
  submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_rack_history_user ON rack_history (user_id, submitted_at DESC);
