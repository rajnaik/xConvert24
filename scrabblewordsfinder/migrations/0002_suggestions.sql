-- Suggestions table for feature requests
CREATE TABLE IF NOT EXISTS suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  suggestion TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
