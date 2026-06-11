-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0006: Add workflow columns to tasks table
-- Adds: estimate, approval, results, suggested_improvements
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tasks ADD COLUMN estimate TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN approval TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN results TEXT NOT NULL DEFAULT '';
ALTER TABLE tasks ADD COLUMN suggested_improvements TEXT NOT NULL DEFAULT '';
