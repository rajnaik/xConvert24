-- Migration 0061: Add media columns to latest_news for Hero News section
ALTER TABLE latest_news ADD COLUMN media_url TEXT DEFAULT '';
ALTER TABLE latest_news ADD COLUMN media_type TEXT DEFAULT '';
-- media_type: 'image', 'video', 'youtube', or '' (no media)
