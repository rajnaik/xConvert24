-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0011: Bug validation + Event Bus for chain dependencies
-- ═══════════════════════════════════════════════════════════════════════

-- Add validated flag and reporter UID to bugs
ALTER TABLE bugs ADD COLUMN validated INTEGER DEFAULT 0;
ALTER TABLE bugs ADD COLUMN reporter_uid TEXT DEFAULT '';

-- ─── Event Bus (triggers chain of dependent actions) ─────────────────
CREATE TABLE IF NOT EXISTS event_bus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  payload TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_bus_type ON event_bus(event_type);
CREATE INDEX IF NOT EXISTS idx_event_bus_status ON event_bus(status);
CREATE INDEX IF NOT EXISTS idx_event_bus_date ON event_bus(created_at DESC);
