-- Scrabble sync table for cross-device persistence of saved words
CREATE TABLE IF NOT EXISTS scrabble_sync (
  uid TEXT PRIMARY KEY,
  achievements TEXT NOT NULL DEFAULT '[]',
  dictionary TEXT NOT NULL DEFAULT 'sowpods',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
