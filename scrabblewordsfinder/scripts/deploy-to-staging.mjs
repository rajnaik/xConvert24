import { execSync } from 'child_process';

console.log('🚀 Deploying to SWF staging...');
execSync('npx wrangler deploy --config wrangler.staging.jsonc', { stdio: 'inherit' });
console.log('✅ Staging deploy complete.');
