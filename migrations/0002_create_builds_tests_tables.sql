-- Build log table
CREATE TABLE IF NOT EXISTS builds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'success',
  duration TEXT DEFAULT '',
  bundle_size TEXT DEFAULT '',
  pages INTEGER DEFAULT 0,
  assets INTEGER DEFAULT 0,
  worker_version_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_builds_timestamp ON builds(timestamp DESC);

-- Test runs table
CREATE TABLE IF NOT EXISTS test_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  total INTEGER DEFAULT 0,
  passed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  duration TEXT DEFAULT '',
  tests_json TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_test_runs_timestamp ON test_runs(timestamp DESC);
