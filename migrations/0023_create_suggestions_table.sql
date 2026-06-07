-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0023: Create suggestions table (was referenced but never created)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  votes_count INTEGER DEFAULT 0,
  votes_total INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_suggestions_created ON suggestions(created_at DESC);
