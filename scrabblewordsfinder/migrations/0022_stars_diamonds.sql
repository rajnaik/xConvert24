-- Stars & Diamonds gamification system
-- Single source of truth: `activities` table drives page rendering + star system

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  component TEXT NOT NULL DEFAULT '',
  star_action TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'gray',
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Daily progress: stars_earned stores activity IDs as JSON array
CREATE TABLE IF NOT EXISTS daily_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  stars_earned TEXT NOT NULL DEFAULT '[]',
  stars_total INTEGER NOT NULL DEFAULT 0,
  diamond INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);

-- Lifetime rewards + streaks
CREATE TABLE IF NOT EXISTS user_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  total_stars INTEGER NOT NULL DEFAULT 0,
  total_diamonds INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  diamond_streak INTEGER NOT NULL DEFAULT 0,
  best_diamond_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date TEXT DEFAULT '',
  last_diamond_date TEXT DEFAULT '',
  theme_unlocked TEXT DEFAULT '[]',
  perks_unlocked TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id)
);

-- Seed the 6 launch activities
INSERT OR IGNORE INTO activities (slug, name, icon, description, component, star_action, color, sort_order) VALUES
  ('wotd', 'Word of the Day', '📖', 'A new Scrabble word every day with meaning and countdown', 'WotdPanel', 'Add word to MWB + Lookup meaning', 'purple', 1),
  ('quiz', 'Word Quiz', '🧠', 'Timed vocabulary quiz — match words to meanings', 'QuizPanel', 'Complete 1 quiz round', 'blue', 2),
  ('wordbench', 'Memory WordBench', '🃏', 'Flash cards with auto-play, categories, and practice tracking', 'WordBenchPanel', 'Complete 1 auto-play session (3+ cards)', 'green', 3),
  ('rack', 'Daily Rack Challenge', '🎲', 'Same 7 tiles for everyone — find the highest-scoring word', 'DailyRackPanel', 'Submit at least 1 valid word', 'amber', 4),
  ('anagram', 'Daily Anagram', '🔤', 'Unscramble a 6-letter word in 5 guesses (Wordle-style)', 'DailyAnagramPanel', 'Make at least 1 guess', 'rose', 5),
  ('sixty', '60-Second Word Finder', '⏱️', 'Find as many words as possible from 7 tiles in 60 seconds', 'SixtySecondPanel', 'Play 1 round (any score)', 'green', 6);
