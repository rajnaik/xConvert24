-- 60-Second Word Finder: stores every word submitted per round
CREATE TABLE IF NOT EXISTS "60sec_history" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  word TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  attempt INTEGER NOT NULL DEFAULT 1,
  split_time INTEGER NOT NULL DEFAULT 60,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast user/round lookups
CREATE INDEX IF NOT EXISTS idx_60sec_user ON "60sec_history" (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_60sec_round ON "60sec_history" (round_id);
