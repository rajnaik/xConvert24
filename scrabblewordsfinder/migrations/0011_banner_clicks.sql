-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0011: Add banner_id to site_status + create banner_clicks table
-- ═══════════════════════════════════════════════════════════════════════

-- Add banner_id column to site_status (nullable text, e.g. "summer-2025")
ALTER TABLE site_status ADD COLUMN banner_id TEXT DEFAULT NULL;

-- Banner click tracking table
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
