-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0024: Create clicks table for high-volume user click tracking
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ui_element TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clicks_user ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_element ON clicks(ui_element);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON clicks(created_at DESC);
