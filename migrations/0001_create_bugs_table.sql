-- Bug reports table
CREATE TABLE IF NOT EXISTS bugs (
  id TEXT PRIMARY KEY,
  page TEXT DEFAULT '',
  href TEXT DEFAULT '',
  severity TEXT DEFAULT 'low',
  description TEXT NOT NULL,
  email TEXT DEFAULT '',
  votes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Index for sorting by votes
CREATE INDEX IF NOT EXISTS idx_bugs_votes ON bugs(votes DESC);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_bugs_created ON bugs(created_at DESC);
