-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0010: Dynamic Org Chart — agents and task history
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS org_agents (
  agent_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  icon TEXT DEFAULT '🤖',
  description TEXT,
  status TEXT DEFAULT 'active',
  sort_order INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS org_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  task TEXT NOT NULL,
  duration TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_org_tasks_agent ON org_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_org_tasks_date ON org_tasks(created_at DESC);

-- Seed default agents
INSERT OR IGNORE INTO org_agents (agent_id, name, role, icon, description, status, sort_order) VALUES
  ('henry', 'Henry', 'CEO & Founder', '👑', 'Vision, strategy, and final decisions', 'active', 1),
  ('kiro', 'Kiro', 'CTO', '🤖', 'Architecture, development, deployment, coordination', 'active', 2),
  ('quill', 'Quill', 'Content Strategist', '✍️', 'SEO blog posts, content calendar, publishing', 'active', 3),
  ('archer', 'Archer', 'SEO Champion', '🎯', 'Technical SEO, keywords, structured data, audits', 'active', 4),
  ('sentinel', 'Sentinel', 'Contagion Tracker', '🛡️', 'Beta Plays — disease data, news aggregation', 'standby', 5);
