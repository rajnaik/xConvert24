-- Add city and country columns to live_sessions for location display
-- These columns may already exist on some environments, so we use a safe pattern
ALTER TABLE live_sessions ADD COLUMN city TEXT DEFAULT '';
ALTER TABLE live_sessions ADD COLUMN country TEXT DEFAULT '';
