-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0007: Add running_time column to tasks table
-- Tracks how long a task has been/was in "running" status.
-- running_started_at: timestamp when task entered "running" status
-- running_time: accumulated running time in seconds
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tasks ADD COLUMN running_started_at TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN running_time INTEGER NOT NULL DEFAULT 0;
