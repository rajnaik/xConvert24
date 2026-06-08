/**
 * Post-deploy script: Logs build details and runs smoke tests against production.
 * 
 * Usage: node scripts/post-deploy.mjs <version> <duration> <bundle_size> <pages> <assets> <worker_id>
 * 
 * After logging the build, it runs HTTP smoke tests against key pages and logs results.
 */

const BASE_URL = 'https://www.xconvert24.com';

const args = process.argv.slice(2);
const version = args[0] || 'unknown';
const duration = args[1] || '';
const bundleSize = args[2] || '';
const pages = parseInt(args[3]) || 0;
const assets = parseInt(args[4]) || 0;
const workerId = args[5] || '';

// Pages to smoke test
const TEST_PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Weight Converter', path: '/convert/weight' },
  { name: 'Temperature Converter', path: '/convert/temperature' },
  { name: 'Currency Converter', path: '/convert/currency' },
  { name: 'Length Converter', path: '/convert/length' },
  { name: 'BMI Calculator', path: '/tools/bmi' },
  { name: 'Crypto Bubbles', path: '/tools/crypto-bubbles' },
  { name: 'Guitar Tuner', path: '/tools/guitar-tuner' },
  { name: 'Image Converter', path: '/tools/image-converter' },
  { name: 'Contagion Tracker', path: '/tools/contagion' },
  { name: 'Blog Index', path: '/blog' },
  { name: 'Search', path: '/search' },
  { name: 'About', path: '/about' },
  { name: 'FAQ', path: '/faq' },
  { name: 'Contact', path: '/contact' },
  { name: 'API: Bugs', path: '/api/bugs' },
  { name: 'API: Favourites', path: '/api/favourites' },
  { name: 'API: Builds', path: '/api/builds' },
];

async function logBuild() {
  console.log(`\n🔨 Logging build v${version}...`);
  try {
    const res = await fetch(`${BASE_URL}/api/builds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version,
        status: 'success',
        duration,
        bundle_size: bundleSize,
        pages,
        assets,
        worker_version_id: workerId,
        notes: `Deployed via CLI at ${new Date().toISOString()}`
      })
    });
    const data = await res.json();
    console.log(`   ✓ Build logged:`, data.success ? 'OK' : data.error);
  } catch (err) {
    console.log(`   ✗ Failed to log build:`, err.message);
  }
}

async function runTests() {
  console.log(`\n🧪 Running smoke tests against ${BASE_URL}...\n`);
  const startTime = Date.now();
  const results = [];
  let passed = 0, failed = 0;

  for (const page of TEST_PAGES) {
    const testStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, { redirect: 'follow' });
      const testDuration = Date.now() - testStart;
      const ok = res.status === 200;
      
      if (ok) {
        passed++;
        console.log(`   ✓ ${page.name} (${res.status}) — ${testDuration}ms`);
      } else {
        failed++;
        console.log(`   ✗ ${page.name} (${res.status}) — ${testDuration}ms`);
      }
      
      results.push({
        name: page.name,
        status: ok ? 'pass' : 'fail',
        duration: `${testDuration}ms`,
        httpStatus: res.status,
      });
    } catch (err) {
      failed++;
      const testDuration = Date.now() - testStart;
      console.log(`   ✗ ${page.name} (ERROR: ${err.message}) — ${testDuration}ms`);
      results.push({
        name: page.name,
        status: 'fail',
        duration: `${testDuration}ms`,
        error: err.message,
      });
    }
  }

  // Security test: check for exposed employee/agent details
  console.log(`\n🔒 Security: checking for exposed sensitive terms...`);
  const sensitiveTerms = ['Sentinel', 'Quill', 'Archer', 'raj007@gmail', 'xconvert24@gmail', 'AUTH_SECRET', 'GOOGLE_CLIENT_SECRET'];
  const securityPages = ['/', '/about', '/contact', '/releases', '/tools/contagion', '/blog'];
  
  for (const sp of securityPages) {
    const testStart = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${sp}`);
      const html = await res.text();
      const testDuration = Date.now() - testStart;
      let foundTerms = [];
      for (const term of sensitiveTerms) {
        if (html.includes(term)) foundTerms.push(term);
      }
      if (foundTerms.length === 0) {
        passed++;
        console.log(`   ✓ Security: ${sp} — clean (${testDuration}ms)`);
        results.push({ name: `Security: ${sp}`, status: 'pass', duration: `${testDuration}ms` });
      } else {
        failed++;
        console.log(`   ✗ Security: ${sp} — EXPOSED: ${foundTerms.join(', ')} (${testDuration}ms)`);
        results.push({ name: `Security: ${sp} [${foundTerms.join(',')}]`, status: 'fail', duration: `${testDuration}ms` });
      }
    } catch (err) {
      failed++;
      results.push({ name: `Security: ${sp}`, status: 'fail', duration: '0ms', error: err.message });
    }
  }

  // Click tracking test: POST a click event and verify it's stored in DB
  console.log(`\n🖱️  Click tracking: verifying clicks are registered in DB...`);
  const clickTestStart = Date.now();
  const clickTestUid = 'postdeploy_test_' + Date.now().toString(36);
  const clickTestElement = 'post-deploy-smoke-test-button';
  const clickTestUrl = '/post-deploy-test';
  try {
    // 1. POST a click event
    const postRes = await fetch(`${BASE_URL}/api/clicks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: clickTestUid,
        ui_element: clickTestElement,
        url: clickTestUrl,
      }),
    });
    const postData = await postRes.json();

    if (postRes.status !== 200 || !postData.success) {
      const dur = Date.now() - clickTestStart;
      failed++;
      console.log(`   ✗ Click POST failed (${postRes.status}) — ${dur}ms`);
      results.push({ name: 'Click Tracking: POST', status: 'fail', duration: `${dur}ms`, error: JSON.stringify(postData) });
    } else {
      // 2. Small delay then GET to verify the click was stored
      await new Promise(r => setTimeout(r, 500));
      const getRes = await fetch(`${BASE_URL}/api/clicks?user_id=${encodeURIComponent(clickTestUid)}&limit=1`);
      const getData = await getRes.json();
      const clickDuration = Date.now() - clickTestStart;

      const clicks = getData.clicks || [];
      const found = clicks.some(c => c.ui_element === clickTestElement && c.user_id === clickTestUid);

      if (found) {
        passed++;
        console.log(`   ✓ Click Tracking: POST + DB verify — ${clickDuration}ms`);
        results.push({ name: 'Click Tracking: POST + DB verify', status: 'pass', duration: `${clickDuration}ms` });
      } else {
        failed++;
        console.log(`   ✗ Click Tracking: click not found in DB after POST — ${clickDuration}ms`);
        results.push({ name: 'Click Tracking: POST + DB verify', status: 'fail', duration: `${clickDuration}ms`, error: 'Click not found in GET response' });
      }
    }
  } catch (err) {
    const dur = Date.now() - clickTestStart;
    failed++;
    console.log(`   ✗ Click Tracking: error — ${err.message} (${dur}ms)`);
    results.push({ name: 'Click Tracking: POST + DB verify', status: 'fail', duration: `${dur}ms`, error: err.message });
  }

  const totalDuration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
  const total = results.length;

  console.log(`\n   ────────────────────────────────────`);
  console.log(`   Total: ${total} | Passed: ${passed} | Failed: ${failed} | Duration: ${totalDuration}`);
  console.log(`   ────────────────────────────────────\n`);

  // Log test results to API
  console.log(`📊 Logging test results...`);
  try {
    const res = await fetch(`${BASE_URL}/api/test-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version,
        total,
        passed,
        failed,
        skipped: 0,
        duration: totalDuration,
        tests: results,
      })
    });
    const data = await res.json();
    console.log(`   ✓ Test run logged:`, data.success ? 'OK' : data.error);
  } catch (err) {
    console.log(`   ✗ Failed to log test run:`, err.message);
  }

  return { total, passed, failed };
}

async function main() {
  await logBuild();
  const { failed } = await runTests();
  
  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) failed! Check the admin panel at /admin/tests`);
    process.exit(1);
  } else {
    console.log(`\n✅ All tests passed! Build v${version} is healthy.`);
  }
}

main().catch(console.error);
