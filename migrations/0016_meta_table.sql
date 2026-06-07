-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0016: Meta table for page URLs and descriptions
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS meta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  meta_description TEXT NOT NULL DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_url ON meta(url);
