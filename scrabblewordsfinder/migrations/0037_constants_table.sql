-- Constants table: DB-driven key-value store for site-wide constants
CREATE TABLE IF NOT EXISTS constants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  text TEXT NOT NULL DEFAULT '',
  datecreated TEXT NOT NULL DEFAULT (datetime('now'))
);
