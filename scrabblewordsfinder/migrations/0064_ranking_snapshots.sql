-- Migration 0064: Ranking snapshots for historical timelines
CREATE TABLE IF NOT EXISTS ranking_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date TEXT NOT NULL,
  ranking_type TEXT NOT NULL,
  player_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  country_code TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON ranking_snapshots(snapshot_date, ranking_type);
