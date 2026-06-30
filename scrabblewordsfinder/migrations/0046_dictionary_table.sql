-- Dictionary table — comprehensive word reference with etymology, spelling tips, and trivia
CREATE TABLE IF NOT EXISTS dictionary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  meaning TEXT NOT NULL,
  fun_fact TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  spelling_tip TEXT DEFAULT '',
  points INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
