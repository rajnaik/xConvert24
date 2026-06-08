-- Migration: Create PrettifyLog table to track prettify runs for blogs and converters
CREATE TABLE IF NOT EXISTS PrettifyLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type TEXT NOT NULL CHECK(page_type IN ('blog', 'converter')),
  page_slug TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 1,
  date_modified TEXT NOT NULL DEFAULT (datetime('now'))
);
