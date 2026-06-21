-- Live sessions table for real-time user presence tracking
-- Each row represents one active browser session (keyed by swf-uid)
CREATE TABLE IF NOT EXISTS live_sessions (
  uid TEXT PRIMARY KEY,
  page TEXT NOT NULL DEFAULT '/',
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for efficient cleanup of stale sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_last_seen ON live_sessions(last_seen);
