-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0025: Add url column to clicks table
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE clicks ADD COLUMN url TEXT DEFAULT '';
