-- Add details column to quiz_scores for per-question tracking
-- Stores JSON array: [{word, meaning, correct, split_time}]
ALTER TABLE quiz_scores ADD COLUMN details TEXT DEFAULT '';
