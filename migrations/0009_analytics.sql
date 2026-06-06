-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0009: Analytics — capture every user interaction
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  event TEXT NOT NULL,
  page TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_page ON analytics(page);
