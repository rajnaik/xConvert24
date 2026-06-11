-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0013: Add comprehensive tracking fields to clicks table
-- Captures geo, device, session, and interaction metadata for analytics
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE clicks ADD COLUMN country TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN city TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN region TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN latitude REAL DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN longitude REAL DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN timezone TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN user_agent TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN referrer TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN device_type TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN browser TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN os TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN language TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN screen_width INTEGER DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN screen_height INTEGER DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN viewport_width INTEGER DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN viewport_height INTEGER DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN session_id TEXT DEFAULT '';
ALTER TABLE clicks ADD COLUMN click_x INTEGER DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN click_y INTEGER DEFAULT NULL;
ALTER TABLE clicks ADD COLUMN page_title TEXT DEFAULT '';
