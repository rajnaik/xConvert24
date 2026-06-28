-- Tracks which blog posts have been ingested into the RAG Vectorize index
CREATE TABLE IF NOT EXISTS ingested_blogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT '',
  category TEXT DEFAULT '',
  chunk_count INTEGER NOT NULL DEFAULT 0,
  ingested_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'success' CHECK(status IN ('success', 'failed', 'pending'))
);

-- Index for quick status checks
CREATE INDEX IF NOT EXISTS idx_ingested_blogs_status ON ingested_blogs(status);
