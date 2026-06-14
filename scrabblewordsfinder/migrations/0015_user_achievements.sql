CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL,
  encouragement_words TEXT DEFAULT '',
  score INTEGER DEFAULT 0,
  word TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
