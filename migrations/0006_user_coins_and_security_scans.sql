-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0006: User coins tracking + Security scans table
-- ═══════════════════════════════════════════════════════════════════════

-- ─── User Coins (ConvertCoins balance) ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_coins (
  id TEXT PRIMARY KEY,
  coins INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_active TEXT,
  total_earned INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_coins_level ON user_coins(level DESC);

-- ─── Coin Events (activity log) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS coin_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  activity TEXT NOT NULL,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_coin_events_user ON coin_events(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_events_date ON coin_events(created_at DESC);

-- ─── Security Scans (Aikido results) ────────────────────────────────
CREATE TABLE IF NOT EXISTS security_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT DEFAULT (datetime('now')),
  files_scanned INTEGER DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  critical INTEGER DEFAULT 0,
  high INTEGER DEFAULT 0,
  medium INTEGER DEFAULT 0,
  low INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_scans_time ON security_scans(timestamp DESC);
