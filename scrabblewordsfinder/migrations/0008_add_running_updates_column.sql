-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0008: Add running_updates column to tasks table
-- Stores live progress updates appended while a task is in "running" status.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tasks ADD COLUMN running_updates TEXT NOT NULL DEFAULT '';
