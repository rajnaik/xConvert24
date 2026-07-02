-- Create memorised_words table for tracking words users mark as memorised
CREATE TABLE IF NOT EXISTS memorised_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userid TEXT NOT NULL,
  word TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_memorised_words_userid ON memorised_words(userid);

-- Unique constraint: a user can only memorise a word once
CREATE UNIQUE INDEX IF NOT EXISTS idx_memorised_words_user_word ON memorised_words(userid, word);
