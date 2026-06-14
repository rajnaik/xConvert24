CREATE TABLE IF NOT EXISTS achievements (
  achievement_id INTEGER PRIMARY KEY,
  achievement_name TEXT NOT NULL,
  achievement_icon TEXT NOT NULL,
  achievement_words TEXT DEFAULT ''
);

INSERT INTO achievements (achievement_id, achievement_name, achievement_icon, achievement_words) VALUES
  (1, 'Rising Star', '⭐', 'Good start! Every point counts. You played a word and that takes courage. Keep going — small scores add up to big wins over time.'),
  (2, 'Word Builder', '👍', 'Nice word! Keep building your vocabulary. You are finding solid plays and making smart use of your tiles. The board is yours to conquer.'),
  (3, 'Hot Streak', '🔥', 'Great play! You are on fire. This score shows real skill — you are reading the board well and placing tiles where they matter most.'),
  (4, 'Triple Threat', '🏆', 'Outstanding! Triple-word territory. You are playing at a competitive level now. Premium squares bow to your strategy and tile mastery.'),
  (5, 'Scrabble Legend', '🌟', 'Legendary! You are a Scrabble master. Scores like this win tournaments. Your rack management, board vision, and vocabulary are elite.');
