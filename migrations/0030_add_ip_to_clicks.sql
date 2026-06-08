-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0030: Add ip_address column to clicks table
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE clicks ADD COLUMN ip_address TEXT DEFAULT '';
