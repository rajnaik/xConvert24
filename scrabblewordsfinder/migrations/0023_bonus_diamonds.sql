-- Bonus diamonds: tracks one-time diamond awards for special actions (e.g. data backup)
-- Each user can earn each bonus type only once.

CREATE TABLE IF NOT EXISTS bonus_diamonds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  bonus_type TEXT NOT NULL,
  awarded_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, bonus_type)
);
