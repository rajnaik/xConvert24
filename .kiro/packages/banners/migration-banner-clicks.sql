-- ═══════════════════════════════════════════════════════════════════════
-- Banner Rotation — Create banner_clicks tracking table
-- Records every click on a banner for analytics
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS banner_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  banner_id TEXT NOT NULL,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  page_url TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_banner_clicks_banner ON banner_clicks(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_clicks_date ON banner_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_banner_clicks_ip ON banner_clicks(ip_address);
