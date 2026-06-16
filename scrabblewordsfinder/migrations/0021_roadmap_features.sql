-- Roadmap features table — drives the public roadmap page
CREATE TABLE IF NOT EXISTS roadmap_features (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'feature',
  status INTEGER NOT NULL DEFAULT 1,
  progress TEXT DEFAULT 'planned',
  icon TEXT DEFAULT '🚀',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed with existing + planned features
INSERT INTO roadmap_features (name, description, category, status, progress, icon, sort_order) VALUES
('Word Solver', 'Real-time Scrabble word finder with tile probability, rack leave analysis, and best opening moves', 'core', 1, 'live', '🔍', 1),
('Word of the Day', 'A new Scrabble-worthy word every day with meaning, fun facts, and 24h countdown', 'activities', 1, 'live', '📖', 2),
('Word Quiz', 'Timed vocabulary quiz — match words to meanings with difficulty levels and score tracking', 'activities', 1, 'live', '🧠', 3),
('Memory WordBench', 'Flash card practice with auto-play, categories, speed control, and calendar tracking', 'activities', 1, 'live', '🃏', 4),
('Daily Rack Challenge', 'Same 7 tiles for everyone — find the highest-scoring word each day', 'activities', 1, 'live', '🎲', 5),
('Daily Anagram', 'Unscramble a 6-letter word in 5 guesses with Wordle-style colour feedback', 'activities', 1, 'live', '🔤', 6),
('Blog (500+ posts)', 'Strategy guides, word lists, letter guides, tournament tips, and Scrabble history', 'content', 1, 'live', '📝', 7),
('SEO Index Tracker', 'Monitor Google indexing status for all pages with bulk analysis', 'admin', 1, 'live', '📊', 8),
('60-Second Word Finder', 'Timed game — find as many words as possible from 7 random tiles in 60 seconds', 'activities', 1, 'planned', '⏱️', 9),
('Streak Counter & XP', 'Gamification — track daily streaks across WOTD, Quiz, Anagram, and earn XP', 'activities', 1, 'planned', '🔥', 10),
('Personal Stats Dashboard', 'Aggregated view of all your activity — words learned, quizzes taken, streaks', 'activities', 1, 'planned', '📈', 11),
('Multiplayer Word Battles', 'Challenge friends to real-time word finding competitions', 'activities', 1, 'planned', '⚔️', 12),
('Word Chains', 'Build a chain where each word starts with the last letter of the previous word', 'activities', 1, 'planned', '🔗', 13),
('Anagram Solver', 'Find all valid anagrams of any word — useful for competitive play', 'tools', 1, 'planned', '🔄', 14),
('Board Simulator', 'Visual Scrabble board where you can place tiles and calculate scores with premium squares', 'tools', 1, 'planned', '🏁', 15),
('Dictionary Deep Dive', 'Explore word origins, definitions, and usage examples with audio pronunciation', 'tools', 1, 'planned', '📚', 16),
('Tournament Timer', 'Competitive play timer with player clock, challenge tracking, and score sheets', 'tools', 1, 'planned', '⏲️', 17),
('Mobile App (PWA)', 'Install ScrabbleWordsFinder as a native app on your phone for offline word solving', 'platform', 1, 'planned', '📱', 18);
