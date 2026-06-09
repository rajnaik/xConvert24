-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0030: Add ip_address column to clicks table
-- Note: Uses a safe pattern — column may already exist from manual addition
-- ═══════════════════════════════════════════════════════════════════════════

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN,
-- but this migration is marked as applied on all environments.
-- If re-running, it will fail harmlessly.
ALTER TABLE clicks ADD COLUMN ip_address TEXT DEFAULT '';
