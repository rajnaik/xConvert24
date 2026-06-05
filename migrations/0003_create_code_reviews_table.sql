-- Code reviews table — logs each code review step in the CI pipeline
CREATE TABLE IF NOT EXISTS code_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'passed',
  issues_found INTEGER DEFAULT 0,
  issues_critical INTEGER DEFAULT 0,
  issues_major INTEGER DEFAULT 0,
  issues_minor INTEGER DEFAULT 0,
  duration TEXT DEFAULT '',
  reviewer TEXT DEFAULT 'sonarqube',
  branch TEXT DEFAULT '',
  commit_hash TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_code_reviews_timestamp ON code_reviews(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_code_reviews_status ON code_reviews(status);
