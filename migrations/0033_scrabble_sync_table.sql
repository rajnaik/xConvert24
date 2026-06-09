-- Migration: Create scrabble_sync table for cross-device scrabble achievement syncing
CREATE TABLE IF NOT EXISTS scrabble_sync (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  achievements TEXT NOT NULL DEFAULT '[]',
  dictionary TEXT NOT NULL DEFAULT 'sowpods',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scrabble_sync_user_id ON scrabble_sync(user_id);
