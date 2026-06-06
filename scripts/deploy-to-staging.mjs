/**
 * Deploy to Staging
 * Reads the Astro-generated wrangler.json, swaps in staging config, deploys, then restores.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const GENERATED_CONFIG = resolve('dist/server/wrangler.json');

if (!existsSync(GENERATED_CONFIG)) {
  console.error('❌ dist/server/wrangler.json not found. Run astro build first.');
  process.exit(1);
}

// Read original generated config
const original = readFileSync(GENERATED_CONFIG, 'utf-8');
const config = JSON.parse(original);

// Swap to staging values
config.name = 'xconvert24-staging';
config.workers_dev = true;

// Replace routes with staging domain
config.routes = [{ pattern: 'staging.xconvert24.com', custom_domain: true }];

// Replace D1 databases with staging IDs
config.d1_databases = [
  {
    binding: 'BUGS_DB',
    database_name: 'xconvert24-staging',
    database_id: 'e28a7b2a-0f77-4c4d-8ea2-d2a30be131a2',
  },
  {
    binding: 'BLOGS_DB',
    database_name: 'xconvert24-staging-blogs',
    database_id: 'ddb48550-7b9b-4bb7-a1ce-7aab9abb65c6',
  },
];

// Replace KV namespace with staging
config.kv_namespaces = [
  {
    binding: 'SESSION',
    id: '53bce1b251724e44a3de02c358bcf7ff',
  },
];

// Write modified config
writeFileSync(GENERATED_CONFIG, JSON.stringify(config, null, 2));
console.log('✅ Staging config written to dist/server/wrangler.json');

try {
  // Deploy using the same mechanism as live
  console.log('🚀 Deploying to staging...');
  execSync('npx wrangler deploy', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Staging deployed successfully!');
} finally {
  // Restore original config
  writeFileSync(GENERATED_CONFIG, original);
  console.log('🔄 Restored original wrangler.json');
}
