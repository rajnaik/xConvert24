-- Migration 0059: Latest news table for auto-refreshing Scrabble news
-- Populated daily by cron job that fetches + AI-summarises recent Scrabble news

CREATE TABLE IF NOT EXISTS latest_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT DEFAULT '',
  source_name TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  published_date TEXT DEFAULT '',
  fetched_at TEXT DEFAULT (datetime('now')),
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_latest_news_active ON latest_news(active, fetched_at);
CREATE INDEX IF NOT EXISTS idx_latest_news_category ON latest_news(category);
