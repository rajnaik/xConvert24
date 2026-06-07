-- Migration 0026: Add details column to AuditLog for command result feedback
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE AuditLog ADD COLUMN details TEXT DEFAULT '';
