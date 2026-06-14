-- ToolSet: tracks all libraries, APIs, services, and tools used across the project
CREATE TABLE IF NOT EXISTS toolset (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'library',
  workspace TEXT NOT NULL DEFAULT 'shared',
  installed_version TEXT DEFAULT '',
  latest_version TEXT DEFAULT '',
  release_date TEXT DEFAULT '',
  breaking_changes TEXT DEFAULT '',
  target_upgrade TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  last_checked TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Seed with current dependencies
INSERT INTO toolset (name, category, workspace, installed_version, latest_version, website_url, notes) VALUES
  ('Astro', 'framework', 'shared', '6.4.4', '6.4.6', 'https://astro.build', 'SSR framework'),
  ('@astrojs/cloudflare', 'adapter', 'shared', '13.6.1', '13.7.0', 'https://docs.astro.build/en/guides/integrations-guide/cloudflare/', 'Cloudflare Workers adapter'),
  ('Tailwind CSS', 'styling', 'shared', '4.3.0', '4.3.1', 'https://tailwindcss.com', 'Utility-first CSS'),
  ('@tailwindcss/vite', 'styling', 'shared', '4.3.0', '4.3.1', 'https://tailwindcss.com', 'Vite plugin for Tailwind'),
  ('Wrangler', 'deploy', 'shared', '4.97.0', '4.100.0', 'https://developers.cloudflare.com/workers/wrangler/', 'Cloudflare CLI'),
  ('TypeScript', 'language', 'swf', '6.0.3', '6.0.3', 'https://www.typescriptlang.org', 'Type-safe JS'),
  ('@astrojs/check', 'tooling', 'swf', '0.9.9', '0.9.9', 'https://docs.astro.build', 'Astro diagnostics'),
  ('Playwright', 'testing', 'shared', '1.60.0', '1.60.0', 'https://playwright.dev', 'E2E testing. SWF has 1.52 installed'),
  ('Node.js', 'runtime', 'shared', '24.16.0', '24.16.0', 'https://nodejs.org', 'JS runtime'),
  ('Cloudflare Workers', 'hosting', 'shared', '-', '-', 'https://dash.cloudflare.com', 'SSR hosting (Free plan)'),
  ('Cloudflare D1', 'database', 'shared', '-', '-', 'https://dash.cloudflare.com', 'SQLite at edge (10 DB limit)'),
  ('Cloudflare KV', 'storage', 'shared', '-', '-', 'https://dash.cloudflare.com', 'Session store'),
  ('Cloudflare Email', 'service', 'shared', '-', '-', 'https://dash.cloudflare.com', 'Outbound email via Workers'),
  ('Google OAuth', 'auth', 'shared', '-', '-', 'https://console.cloud.google.com', 'Admin authentication'),
  ('DictionaryAPI.dev', 'api', 'swf', '-', '-', 'https://dictionaryapi.dev', 'Word definitions (rate limited)'),
  ('Google Ads', 'advertising', 'shared', 'AW-18216393264', '-', 'https://ads.google.com', 'Conversion tracking'),
  ('astro-mcp', 'plugin', 'xconvert', '0.4.2', '0.4.2', 'https://github.com/anthropics/astro-mcp', 'MCP integration');
