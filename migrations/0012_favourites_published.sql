-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0012: Published Favourites
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS favourites_published (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  items TEXT NOT NULL,
  item_count INTEGER DEFAULT 0,
  hidden INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fav_pub_user ON favourites_published(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_pub_date ON favourites_published(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fav_pub_hidden ON favourites_published(hidden);
