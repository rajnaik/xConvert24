-- Migration 0060: Add last_news_fetch column to site_status
ALTER TABLE site_status ADD COLUMN last_news_fetch TEXT DEFAULT '';
