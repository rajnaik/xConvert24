-- Add history tracking to Cows and Bulls games
-- Adds user_id, solved status, and attempt count to CaB_Scores
-- Creates CaB_Guesses table to store individual guesses per game

ALTER TABLE CaB_Scores ADD COLUMN user_id TEXT DEFAULT '';
ALTER TABLE CaB_Scores ADD COLUMN solved INTEGER NOT NULL DEFAULT 0;
ALTER TABLE CaB_Scores ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

-- Index for quick user history lookups
CREATE INDEX IF NOT EXISTS idx_cab_scores_user ON CaB_Scores (user_id);

-- Individual guesses per game round
CREATE TABLE IF NOT EXISTS CaB_Guesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  guess_number INTEGER NOT NULL,
  guess TEXT NOT NULL,
  bulls INTEGER NOT NULL DEFAULT 0,
  cows INTEGER NOT NULL DEFAULT 0,
  feedback TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (game_id) REFERENCES CaB_Scores(id)
);

CREATE INDEX IF NOT EXISTS idx_cab_guesses_game ON CaB_Guesses (game_id);
