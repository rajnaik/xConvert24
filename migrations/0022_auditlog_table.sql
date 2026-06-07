-- AuditLog table: records every steering command execution
CREATE TABLE IF NOT EXISTS AuditLog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
