-- Add page_history column to live_sessions for tracking page trail
-- Stores a JSON array of { page, ts } objects (capped at 20 entries)
ALTER TABLE live_sessions ADD COLUMN page_history TEXT NOT NULL DEFAULT '[]';
