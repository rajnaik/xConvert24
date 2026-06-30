-- Add user_id, word, score columns to achievements table for Tile Scores save feature
ALTER TABLE achievements ADD COLUMN user_id TEXT DEFAULT '';
ALTER TABLE achievements ADD COLUMN word TEXT DEFAULT '';
ALTER TABLE achievements ADD COLUMN score INTEGER DEFAULT 0;
ALTER TABLE achievements ADD COLUMN level INTEGER DEFAULT 0;
