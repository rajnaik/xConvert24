-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0004: Create clicks + ClicksAnalysis tables for click tracking
-- ═══════════════════════════════════════════════════════════════════════

-- Raw click events (high-volume)
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ui_element TEXT NOT NULL,
  url TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_clicks_user ON clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_element ON clicks(ui_element);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_ip ON clicks(ip_address);

-- Aggregated clicks analysis (grouped by IP with geo data)
CREATE TABLE IF NOT EXISTS ClicksAnalysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL UNIQUE,
  click_count INTEGER DEFAULT 0,
  latitude REAL,
  longitude REAL,
  city TEXT,
  country TEXT,
  last_seen TEXT
);

CREATE INDEX IF NOT EXISTS idx_clicksanalysis_ip ON ClicksAnalysis(ip_address);
CREATE INDEX IF NOT EXISTS idx_clicksanalysis_country ON ClicksAnalysis(country);
