-- Migration 0058: Competitive Scrabble hub tables
-- Player rankings (WESPA-style) and tournament calendar

CREATE TABLE IF NOT EXISTS player_rankings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  country_code TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  peak_rating INTEGER NOT NULL DEFAULT 0,
  titles TEXT DEFAULT '',
  ranking_type TEXT NOT NULL DEFAULT 'wespa',
  active INTEGER NOT NULL DEFAULT 1,
  last_updated TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'others',
  status TEXT NOT NULL DEFAULT 'upcoming',
  wespa_rated INTEGER NOT NULL DEFAULT 1,
  url TEXT DEFAULT '',
  winner TEXT DEFAULT '',
  participants INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_player_rankings_type_rank ON player_rankings(ranking_type, rank);
CREATE INDEX IF NOT EXISTS idx_player_rankings_country ON player_rankings(country_code);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_tier ON tournaments(tier);
