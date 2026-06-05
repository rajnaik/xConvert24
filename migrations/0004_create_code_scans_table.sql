-- Code scans table — logs each SonarQube code scan result
CREATE TABLE IF NOT EXISTS code_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'passed',
  bugs INTEGER DEFAULT 0,
  vulnerabilities INTEGER DEFAULT 0,
  code_smells INTEGER DEFAULT 0,
  coverage TEXT DEFAULT '',
  duplications TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  commit_hash TEXT DEFAULT '',
  scanner TEXT DEFAULT 'sonarqube',
  summary TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_code_scans_timestamp ON code_scans(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_code_scans_status ON code_scans(status);
