-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0009: Site status table (status + active logo)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  status TEXT NOT NULL DEFAULT 'golden',
  logo_option INTEGER NOT NULL DEFAULT 1 CHECK (logo_option BETWEEN 1 AND 5),
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT 'system'
);

-- Insert default row
INSERT OR IGNORE INTO site_status (id, status, logo_option) VALUES (1, 'golden', 1);
