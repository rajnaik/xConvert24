-- Leaderboard: per-game, per-day scores for competitive ranking
-- Tracks best single word AND total score per user per game per day
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game TEXT NOT NULL,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  best_word TEXT NOT NULL DEFAULT '',
  best_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  words_played INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(game, user_id, date)
);

-- Fast lookups: today's leaderboard by game
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_date ON leaderboard(game, date, best_score DESC);

-- Fast lookups: user's history in a game
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_game ON leaderboard(user_id, game, date DESC);

-- All-time best scores per game
CREATE INDEX IF NOT EXISTS idx_leaderboard_alltime ON leaderboard(game, total_score DESC);
