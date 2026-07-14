-- Migration 0065: Update roadmap_features progress for v1.18–v1.20.5 shipped features
-- Date: July 14, 2026

-- Stars & Diamonds Gamification (shipped v1.18.0)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 19;

-- Rankings Expansion (shipped v1.20.1)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 23;

-- Public APIs (shipped v1.20.4)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 24;

-- Machine-Readable Data (shipped v1.20.4)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 25;

-- Strengthen E-E-A-T (shipped v1.20.0)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 26;

-- Add llms.txt (shipped v1.20.3)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 27;

-- Definitive Reference Pages (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 28;

-- Encourage Citations (shipped v1.20.4 — CiteThis component)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 29;

-- AI-Specific Discoverability (shipped v1.20.3 — llms.txt + llms-full.txt)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 31;

-- /api/public/search — Knowledge Base Search API (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 32;

-- /api/public/player/{id} — Player Profile API (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 33;

-- /api/public/statistics — Scrabble Statistics API (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 34;

-- RSS Feeds — News, Blog, Rankings, Tournaments (shipped v1.20.4)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 35;

-- Methodology Pages (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 36;

-- Research Hub (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 37;

-- Scrabble Insights Section (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 41;

-- Platform/Developer Page (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 44;

-- Monthly Rankings Snapshot — manual button (shipped v1.20.5)
UPDATE roadmap_features SET progress = 'live', updated_at = datetime('now') WHERE id = 45;
