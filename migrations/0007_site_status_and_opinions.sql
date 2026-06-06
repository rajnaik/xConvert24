-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0007: Site status tracking + User opinions
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Site Status (Golden / Green / Red) ──────────────────────────────
CREATE TABLE IF NOT EXISTS site_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  status TEXT NOT NULL DEFAULT 'golden',
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT 'system'
);

-- Insert default golden status
INSERT OR IGNORE INTO site_status (id, status) VALUES (1, 'golden');

-- ─── User Opinions (polls/surveys) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS opinions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_opinions_question ON opinions(question_id);
CREATE INDEX IF NOT EXISTS idx_opinions_date ON opinions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opinions_user ON opinions(user_id);
