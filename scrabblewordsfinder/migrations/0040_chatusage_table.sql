-- ChatUsage table — logs every chat interaction with ScrabbleBot AI
CREATE TABLE IF NOT EXISTS chatusage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT '',
  user_message TEXT NOT NULL DEFAULT '',
  bot_response TEXT DEFAULT '',
  model TEXT DEFAULT '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  tokens_used INTEGER DEFAULT 0,
  response_ms INTEGER DEFAULT 0,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  session_id TEXT DEFAULT '',
  success INTEGER NOT NULL DEFAULT 1,
  error_message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
