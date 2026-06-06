-- ═══════════════════════════════════════════════════════════════════════
-- Migration 0015: Hooks table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS hooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  version TEXT DEFAULT '1.0.0',
  enabled INTEGER DEFAULT 1,
  event_type TEXT NOT NULL,
  event_patterns TEXT DEFAULT '',
  event_tool_types TEXT DEFAULT '',
  action_type TEXT NOT NULL,
  action_prompt TEXT DEFAULT '',
  action_command TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hooks_enabled ON hooks(enabled);
CREATE INDEX IF NOT EXISTS idx_hooks_event_type ON hooks(event_type);

-- Seed existing hooks
INSERT OR IGNORE INTO hooks (id, name, description, version, enabled, event_type, event_patterns, event_tool_types, action_type, action_prompt, action_command) VALUES
  (1, 'Aikido Scan on Write', 'Runs an Aikido security scan after any file is written or modified', '1', 0, 'postToolUse', '', 'write', 'askAgent', 'A file was just written or modified. Activate the aikido-kiro-power and run aikido_full_scan on all files that were created or modified in this session. Fix any findings and rescan to verify.', ''),
  (2, 'No Auto Deploy', 'Prevents the agent from running wrangler deploy without the user explicitly asking for it. Always ask first.', '1', 1, 'preToolUse', '', 'shell', 'askAgent', 'IMPORTANT: If the command you are about to run contains ''wrangler deploy'' or ''npm run deploy'', STOP. Do NOT execute it unless the user has EXPLICITLY asked you to deploy in their most recent message. If they haven''t, inform them the build is ready and ask if they want to deploy.', ''),
  (3, 'Post-Build Code Scan Reminder', 'After a task completes (including builds), remind the agent to run a SonarQube code scan to ensure code quality is tracked.', '1.0.0', 1, 'postTaskExecution', '', '', 'askAgent', 'REMINDER: After completing this task, if a build was performed, run a SonarQube code scan using the sonarqube power to check for any new issues introduced. Report the scan results to the user.', ''),
  (4, 'Code Review Pre-Build Gate', 'Enforces the CI pipeline: 1. Write code → 2. Run tests → 3. Code review (SonarQube) → 4. Build → 5. Deploy.', '1.0.0', 1, 'preToolUse', '', 'shell', 'askAgent', 'IMPORTANT CI PIPELINE GATE: If the command about to be run is astro build, npm run build, or npm run deploy, STOP and verify the pipeline steps have been completed in order.', ''),
  (5, 'Aikido Security Scan After SonarQube', 'Runs an Aikido security scan after SonarQube code review completes and before the final build.', '1.0.0', 1, 'postToolUse', '', '.*sonar.*', 'askAgent', 'A SonarQube scan just completed. Now run an Aikido security scan on all files that were modified in this session.', ''),
  (6, 'Post-Deploy Tests', 'After a task is completed (like a build or deploy), remind the agent to run tests against the live site and log the build details.', '1', 1, 'postTaskExecution', '', '', 'askAgent', 'After deploying, run a quick smoke test by checking that the homepage and a few key pages return HTTP 200 from www.xconvert24.com. Report any failures.', ''),
  (7, 'Auto-update Docs', 'When dependency-related files, build pipeline, or tech stack are modified, remind the agent to update the corresponding documentation.', '1', 1, 'fileEdited', 'src/pages/api/*.ts,src/layouts/Layout.astro,src/data/BuildPipeline.xml,migrations/*.sql,wrangler.jsonc', '', 'askAgent', 'A file related to dependencies, build pipeline, tech stack, or database was modified. Check if any of these need updating.', ''),
  (8, 'LTM Post-Turn Capture', 'Records agent activity to LTM memory store after each turn', '1.0.0', 1, 'agentStop', '', '', 'runCommand', '', 'python3 ltm/bin/ltm.py capture-turn');
