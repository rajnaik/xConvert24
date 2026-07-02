-- Users table: avatar system for leaderboards and multiplayer games
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for leaderboard queries (sorted by created_at for "newest users")
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
