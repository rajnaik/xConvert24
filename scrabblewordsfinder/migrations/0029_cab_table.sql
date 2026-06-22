-- Cows and Bulls game words table
CREATE TABLE IF NOT EXISTS CaB (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  length INTEGER NOT NULL,
  dateCreated TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'active'
);

-- Index for quick lookups by length and status
CREATE INDEX IF NOT EXISTS idx_cab_length_status ON CaB (length, status);
