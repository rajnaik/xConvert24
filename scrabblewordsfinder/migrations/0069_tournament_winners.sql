-- Tournament winners history table
-- Stores champions for all major Scrabble tournaments across years
CREATE TABLE IF NOT EXISTS tournament_winners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament TEXT NOT NULL,
  year INTEGER NOT NULL,
  winner_name TEXT NOT NULL,
  winner_country TEXT DEFAULT '',
  winner_country_code TEXT DEFAULT '',
  runner_up TEXT DEFAULT '',
  runner_up_country TEXT DEFAULT '',
  location TEXT DEFAULT '',
  division TEXT DEFAULT 'main',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tw_tournament ON tournament_winners(tournament);
CREATE INDEX IF NOT EXISTS idx_tw_year ON tournament_winners(year DESC);
CREATE INDEX IF NOT EXISTS idx_tw_winner ON tournament_winners(winner_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tw_unique ON tournament_winners(tournament, year, division);
