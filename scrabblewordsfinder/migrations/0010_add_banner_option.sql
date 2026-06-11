-- Migration: Add banner_option column to site_status
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE site_status ADD COLUMN banner_option INTEGER NOT NULL DEFAULT 1;
