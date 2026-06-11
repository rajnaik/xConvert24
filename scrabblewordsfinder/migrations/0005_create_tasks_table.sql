-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0005: Create tasks table for admin task management
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_name TEXT NOT NULL,
  task_category TEXT NOT NULL DEFAULT 'general',
  task_description TEXT NOT NULL DEFAULT '',
  date_created TEXT NOT NULL DEFAULT (datetime('now')),
  date_modified TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'pending',
  plan TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(task_category);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_date_created ON tasks(date_created DESC);
