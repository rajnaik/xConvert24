-- SEO Index Tracking: records which pages Google has indexed
CREATE TABLE IF NOT EXISTS seo_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'indexed' CHECK(status IN ('indexed', 'discovered', 'not_indexed', 'excluded', 'error')),
  last_crawled TEXT DEFAULT NULL,
  first_indexed TEXT DEFAULT NULL,
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
