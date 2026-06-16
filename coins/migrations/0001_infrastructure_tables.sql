-- Infrastructure tables for xCrypto24
-- Emails, Clicks, Telemetry

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT 'contact',
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  message TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  comment TEXT DEFAULT '',
  read INTEGER NOT NULL DEFAULT 0,
  actioned INTEGER NOT NULL DEFAULT 0,
  date_actioned TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT '',
  ui_element TEXT DEFAULT '',
  url TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  country TEXT DEFAULT '',
  city TEXT DEFAULT '',
  region TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  device_type TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  os TEXT DEFAULT '',
  language TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  screen_width INTEGER,
  screen_height INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  click_x INTEGER,
  click_y INTEGER,
  page_title TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint_name TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_ms INTEGER NOT NULL,
  healthy INTEGER NOT NULL DEFAULT 1,
  checked_at TEXT NOT NULL DEFAULT (datetime('now'))
);
