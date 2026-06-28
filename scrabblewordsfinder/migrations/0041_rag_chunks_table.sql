-- RAG chunks table: stores blog content chunks mapped to Vectorize IDs
CREATE TABLE IF NOT EXISTS rag_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vector_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  title TEXT DEFAULT '',
  category TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for fast lookup by slug
CREATE INDEX IF NOT EXISTS idx_rag_chunks_slug ON rag_chunks(slug);
