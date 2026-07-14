-- Migration 0066: v1.21 Living Scrabble Database tables
-- Date: July 14, 2026

-- 1. Rating changes (computed from snapshots)
CREATE TABLE IF NOT EXISTS rating_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  rank_before INTEGER NOT NULL,
  rank_after INTEGER NOT NULL,
  change_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_changes_player ON rating_changes(player_name, ranking_type);
CREATE INDEX IF NOT EXISTS idx_changes_date ON rating_changes(change_date DESC);

-- 2. Country statistics (aggregated monthly)
CREATE TABLE IF NOT EXISTS country_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  total_players INTEGER NOT NULL DEFAULT 0,
  avg_rating INTEGER NOT NULL DEFAULT 0,
  top_player TEXT DEFAULT '',
  top_rating INTEGER DEFAULT 0,
  total_titles INTEGER DEFAULT 0,
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  snapshot_date TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_country_stats_date ON country_stats(snapshot_date, ranking_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_country_stats_unique ON country_stats(country_code, ranking_type, snapshot_date);

-- 3. Scrabble records (manually curated + auto-detected)
CREATE TABLE IF NOT EXISTS scrabble_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  record_name TEXT NOT NULL,
  record_value TEXT NOT NULL,
  holder_name TEXT DEFAULT '',
  holder_country TEXT DEFAULT '',
  achieved_date TEXT DEFAULT '',
  source TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Tournament results (detailed placements)
CREATE TABLE IF NOT EXISTS tournament_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER REFERENCES tournaments(id),
  position INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  country_code TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  spread INTEGER DEFAULT 0,
  rating_before INTEGER DEFAULT 0,
  rating_after INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_results_tournament ON tournament_results(tournament_id, position);
CREATE INDEX IF NOT EXISTS idx_results_player ON tournament_results(player_name);

-- 5. Index on existing ranking_snapshots for player lookup
CREATE INDEX IF NOT EXISTS idx_snapshots_player ON ranking_snapshots(player_name, ranking_type);
