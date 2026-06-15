-- Word of the Day: daily rotating word display
CREATE TABLE IF NOT EXISTS word_of_the_day (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL UNIQUE,
  date TEXT DEFAULT NULL,
  meaning TEXT DEFAULT '',
  fun_fact TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Word Quiz: 1000+ words with meanings for quiz game
CREATE TABLE IF NOT EXISTS word_quiz (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL DEFAULT '',
  date_created TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Achievements: stores quiz results and other achievements
CREATE TABLE IF NOT EXISTS achievements (
  a_id INTEGER PRIMARY KEY AUTOINCREMENT,
  achievement_text TEXT NOT NULL,
  date_created TEXT NOT NULL DEFAULT (datetime('now')),
  a_data TEXT DEFAULT ''
);
