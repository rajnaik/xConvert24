-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0014: Vocabulary table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_name ON vocabulary(name);

-- Seed initial vocabulary entry for Feature Flags
INSERT OR IGNORE INTO vocabulary (id, name, abbreviation, created_at) VALUES
  (1, 'Feature Flags', 'FF', datetime('now'));
