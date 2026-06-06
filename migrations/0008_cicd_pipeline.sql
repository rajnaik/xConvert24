-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0008: CI/CD Pipeline configuration storage
-- ═══════════════════════════════════════════════════════════════════════

-- ─── CICD Pipeline Config (stores BuildPipeline.xml content) ─────────
CREATE TABLE IF NOT EXISTS cicd_pipeline (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  pipeline_xml TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  updated_by TEXT DEFAULT 'system'
);

-- ─── CICD Pipeline Run History ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS cicd_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT,
  status TEXT DEFAULT 'running',
  steps_run TEXT,
  steps_skipped TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  result TEXT
);

CREATE INDEX IF NOT EXISTS idx_cicd_runs_date ON cicd_runs(started_at DESC);
