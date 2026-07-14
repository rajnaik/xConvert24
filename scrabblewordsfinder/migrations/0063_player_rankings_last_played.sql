-- Migration 0063: Add last_played column for online ratings date display
ALTER TABLE player_rankings ADD COLUMN last_played TEXT DEFAULT '';
