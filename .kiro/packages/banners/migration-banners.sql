-- ═══════════════════════════════════════════════════════════════════════
-- Banner Rotation — Create banners table
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

-- Seed 10 banners (default: banner 1 active, rest inactive)
-- CUSTOMIZE: Replace names/descriptions for destination site
INSERT INTO banners (option_number, name, description, status) VALUES
  (1, 'Banner 1', 'Primary hero banner | Free online tool', 'active'),
  (2, 'Banner 2', 'Secondary variant | Instant results', 'inactive'),
  (3, 'Banner 3', 'Alternate design | No-signup required', 'inactive'),
  (4, 'Banner 4', 'Feature highlight | Realtime conversion', 'inactive'),
  (5, 'Banner 5', 'Minimal style | Fast and free', 'inactive'),
  (6, 'Banner 6', 'Bold layout | Automatic updates', 'inactive'),
  (7, 'Banner 7', 'Dark theme | Zero friction', 'inactive'),
  (8, 'Banner 8', 'Gradient style | Free forever', 'inactive'),
  (9, 'Banner 9', 'Geometric | Instant answers', 'inactive'),
  (10, 'Banner 10', 'Premium look | No paywalls', 'inactive');
