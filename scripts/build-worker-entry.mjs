/**
 * Post-build script: Adds the email() handler to Astro's generated Worker entry.
 *
 * Astro's @astrojs/cloudflare adapter generates dist/server/entry.mjs with only
 * a default export containing `fetch`. This script wraps that entry to also
 * export `email()` for Cloudflare Email Routing.
 *
 * Run after `astro build`:
 *   node scripts/build-worker-entry.mjs
 *
 * The script:
 * 1. Reads the generated dist/server/entry.mjs
 * 2. Extracts the chunk import and the default export variable name
 * 3. Rewrites it to export a combined object with both fetch and email handlers
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const entryPath = resolve(projectRoot, 'dist/server/entry.mjs');

if (!existsSync(entryPath)) {
  console.error('[build-worker-entry] dist/server/entry.mjs not found. Run `astro build` first.');
  process.exit(1);
}

const originalEntry = readFileSync(entryPath, 'utf-8');

// The generated entry.mjs looks like:
// import { w } from "./chunks/worker-entry_XXXX.mjs";
// import "cloudflare:workers";
// export { w as default };
//
// We need to wrap it so the default export includes both fetch and email.

// Extract the variable name used for the Worker (e.g., "w")
const exportMatch = originalEntry.match(/export\s*\{\s*(\w+)\s+as\s+default\s*\}/);
if (!exportMatch) {
  console.error('[build-worker-entry] Could not parse default export from entry.mjs');
  console.error('Content:', originalEntry);
  process.exit(1);
}

const workerVarName = exportMatch[1];

// Build the new entry that wraps Astro's fetch with our email handler
const newEntry = `${originalEntry.replace(/export\s*\{\s*\w+\s+as\s+default\s*\};?\s*$/, '')}

// --- Email handler integration (added by scripts/build-worker-entry.mjs) ---

/**
 * Inbound email handler for Cloudflare Email Routing.
 * Routes contact@, support@, info@xconvert24.com → SWF_NOTIFY_EMAIL secret.
 */
async function emailHandler(message, env, ctx) {
  const destination = env.SWF_NOTIFY_EMAIL;
  if (!destination || !destination.trim()) {
    console.error('[email] SWF_NOTIFY_EMAIL not configured — discarding message');
    return;
  }
  try {
    await message.forward(destination);
  } catch (err) {
    console.error(\`[email] Forward failed for \${message.from}: \${err.message || err}\`);
  }
}

// Combined Worker export: Astro's fetch + email handler
export default {
  fetch: ${workerVarName}.fetch.bind(${workerVarName}),
  email: emailHandler,
};
`;

writeFileSync(entryPath, newEntry, 'utf-8');
console.log('[build-worker-entry] ✅ Added email() handler to dist/server/entry.mjs');
