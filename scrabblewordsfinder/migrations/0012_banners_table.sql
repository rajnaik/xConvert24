-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0012: Create banners table for per-banner active/inactive status
-- Enables banner rotation — all active banners participate in random selection
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  option_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed all 10 banners (default: only banner 1 is active)
INSERT INTO banners (option_number, name, description, status) VALUES
  (1, 'Banner 1', 'Classic — board left, title center, scattered tiles right', 'active'),
  (2, 'Banner 2', 'Perspective — angled board with glow, high-value tile row', 'inactive'),
  (3, 'Banner 3', 'Spelled out — SCRABBLE in tiles, glass top-right, dark minimal', 'inactive'),
  (4, 'Banner 4', 'Split text — Scrabble + Word Finder stacked, diagonal board', 'inactive'),
  (5, 'Banner 5', 'Rack focus — tiles inside glass, rack at bottom with holder', 'inactive'),
  (6, 'Banner 6', 'Crossword — PLAY/WORDS intersection, spotlight glow, badge', 'inactive'),
  (7, 'Banner 7', 'Dual glass — overlapping magnifiers, score display, gold tiles', 'inactive'),
  (8, 'Banner 8', 'Symmetric — centered glass top, flanking tiles, wave bottom', 'inactive'),
  (9, 'Banner 9', 'Isometric — skewed board, SCRABBLE header, pill badges', 'inactive'),
  (10, 'Banner 10', 'Grand — tiles arc, large central glass with board inside, orbs', 'inactive');
