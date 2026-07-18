CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT 'contact',
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT DEFAULT '',
  service TEXT DEFAULT '',
  timeline TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  read INTEGER NOT NULL DEFAULT 0,
  actioned INTEGER NOT NULL DEFAULT 0,
  date_actioned TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
