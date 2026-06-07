-- Migration: Create ConvertorsInPipeline table
CREATE TABLE IF NOT EXISTS ConvertorsInPipeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ConvertorName TEXT NOT NULL,
  Category TEXT,
  ConvertorContent TEXT,
  DateCreated TEXT DEFAULT (datetime('now')),
  DateModified TEXT DEFAULT (datetime('now')),
  status INTEGER DEFAULT 1
);
