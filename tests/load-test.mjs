/**
 * Load test: Simulates 20 concurrent users randomly interacting with xConvert24.com
 * - Clicking links (converters, tools, pages)
 * - Adding favourites
 * - Reporting bugs
 * - Voting on bugs
 * - Submitting suggestions
 * - Rating suggestions
 *
 * Usage: node tests/load-test.mjs
 */

const BASE = 'https://xconvert24-com.xconvert.workers.dev';
const CONCURRENT_USERS = 20;
const ACTIONS_PER_USER = 10;

const pages = [
  '/', '/convert/weight', '/convert/length', '/convert/temperature',
  '/convert/area', '/convert/volume', '/convert/speed', '/convert/data',
  '/convert/currency', '/convert/time', '/convert/cooking', '/convert/energy',
  '/convert/pressure', '/convert/power', '/convert/fuel', '/convert/angle',
  '/convert/frequency', '/convert/base', '/convert/roman',
  '/tools/bmi', '/tools/color', '/tools/clock', '/tools/calculator',
  '/tools/tip', '/tools/discount', '/tools/loan', '/tools/age',
  '/tools/date-diff', '/tools/stopwatch', '/tools/alarm', '/tools/reminder',
  '/search', '/about', '/faq', '/guide', '/report-bug', '/vote-bugs',
  '/suggest', '/suggestions', '/releases', '/favourites',
];

const bugDescriptions = [
  'Conversion result shows too many decimal places',
  'Dark mode toggle does not persist on refresh',
  'Swap button does not update the formula display',
  'Mobile hamburger menu overlaps content',
  'Color wheel does not work on Safari',
  'Loan calculator shows negative balance on last month',
  'Currency rates seem outdated',
  'Search dropdown clips on small screens',
  'Temperature converter shows NaN for empty input',
  'Age calculator wrong when birthday is today',
];

const suggestionTitles = [
  'Shoe size converter (US/UK/EU)',
  'Timezone converter with DST',
  'Percentage calculator',
  'Text case converter (UPPER/lower/Title)',
  'Electricity cost calculator',
  'Password generator',
  'QR code generator',
  'Unit price comparison tool',
  'Body fat percentage calculator',
  'Mortgage affordability calculator',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function fetchJSON(url, opts = {}) {
  try {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts.headers } });
    return { status: res.status, data: await res.json().catch(() => null) };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

// ─── User actions ────────────────────────────────────────────────────────────

async function visitPage(userId) {
  const page = pick(pages);
  const res = await fetch(BASE + page);
  console.log(`  [User ${userId}] 📄 Visit ${page} → ${res.status}`);
  return page;
}

async function addFavourite(userId) {
  const href = pick(pages.filter(p => p.startsWith('/convert/') || p.startsWith('/tools/')));
  const r = await fetchJSON(BASE + '/api/favourites', {
    method: 'POST',
    body: JSON.stringify({ href, action: 'add' }),
  });
  console.log(`  [User ${userId}] ❤️  Favourite ${href} → ${r.status}`);
}

async function removeFavourite(userId) {
  const href = pick(pages.filter(p => p.startsWith('/convert/') || p.startsWith('/tools/')));
  const r = await fetchJSON(BASE + '/api/favourites', {
    method: 'POST',
    body: JSON.stringify({ href, action: 'remove' }),
  });
  console.log(`  [User ${userId}] 💔 Unfavourite ${href} → ${r.status}`);
}

async function reportBug(userId) {
  const page = pick(pages.filter(p => p.startsWith('/convert/') || p.startsWith('/tools/')));
  const r = await fetchJSON(BASE + '/api/bugs', {
    method: 'POST',
    body: JSON.stringify({
      page: page.split('/').pop(),
      href: page,
      severity: pick(['low', 'medium', 'high']),
      description: pick(bugDescriptions),
      email: `user${userId}@loadtest.com`,
    }),
  });
  console.log(`  [User ${userId}] 🐛 Report bug on ${page} → ${r.status}`);
}

async function voteBug(userId) {
  // First get bugs list
  const list = await fetchJSON(BASE + '/api/bugs');
  const bugs = list.data?.bugs || [];
  if (!bugs.length) return;
  const bug = pick(bugs);
  const r = await fetchJSON(BASE + '/api/bugs/vote', {
    method: 'POST',
    body: JSON.stringify({ id: bug.id, direction: 'up' }),
  });
  console.log(`  [User ${userId}] 👍 Vote bug "${bug.id}" → ${r.status}`);
}

async function submitSuggestion(userId) {
  const title = pick(suggestionTitles) + ` (user ${userId})`;
  const r = await fetchJSON(BASE + '/api/suggestions', {
    method: 'POST',
    body: JSON.stringify({
      title,
      description: 'This would be really useful for everyday calculations.',
      category: pick(['measurement', 'digital', 'finance', 'time', 'creative', 'math', 'other']),
    }),
  });
  console.log(`  [User ${userId}] 💡 Suggest "${title.slice(0, 30)}…" → ${r.status}`);
}

async function rateSuggestion(userId) {
  const list = await fetchJSON(BASE + '/api/suggestions');
  const suggestions = list.data?.suggestions || [];
  if (!suggestions.length) return;
  const sug = pick(suggestions);
  const stars = randInt(3, 5);
  const r = await fetchJSON(BASE + '/api/suggestions/rate', {
    method: 'POST',
    body: JSON.stringify({ id: sug.id, stars }),
  });
  console.log(`  [User ${userId}] ⭐ Rate suggestion "${sug.id}" ${stars}★ → ${r.status}`);
}

async function checkAPI(userId) {
  const r = await fetchJSON(BASE + '/api/bugs');
  console.log(`  [User ${userId}] 🔍 GET /api/bugs → ${r.status} (${r.data?.bugs?.length || 0} bugs)`);
}

// ─── Simulate one user session ───────────────────────────────────────────────

async function simulateUser(userId) {
  console.log(`\n👤 User ${userId} started session`);
  const actions = [
    visitPage, visitPage, visitPage, // more likely to browse
    addFavourite, removeFavourite,
    reportBug, voteBug,
    submitSuggestion, rateSuggestion,
    checkAPI,
  ];

  for (let i = 0; i < ACTIONS_PER_USER; i++) {
    const action = pick(actions);
    await action(userId);
    // Small random delay between actions (50-300ms)
    await new Promise(r => setTimeout(r, randInt(50, 300)));
  }
  console.log(`✅ User ${userId} completed ${ACTIONS_PER_USER} actions`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 Load Test: ${CONCURRENT_USERS} concurrent users × ${ACTIONS_PER_USER} actions`);
  console.log(`🌐 Target: ${BASE}`);
  console.log('═══════════════════════════════════════════════════════════');

  const start = Date.now();

  // Launch all users concurrently
  const users = Array.from({ length: CONCURRENT_USERS }, (_, i) => simulateUser(i + 1));
  await Promise.all(users);

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  const totalActions = CONCURRENT_USERS * ACTIONS_PER_USER;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Load test complete`);
  console.log(`   ${CONCURRENT_USERS} users × ${ACTIONS_PER_USER} actions = ${totalActions} total requests`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Throughput: ${(totalActions / parseFloat(duration)).toFixed(1)} req/s`);
  console.log('═══════════════════════════════════════════════════════════');

  // Final stats
  console.log('\n📊 Final database state:');
  const bugs = await fetchJSON(BASE + '/api/bugs');
  console.log(`   Bugs: ${bugs.data?.bugs?.length || 0}`);
  const sug = await fetchJSON(BASE + '/api/suggestions');
  console.log(`   Suggestions: ${sug.data?.suggestions?.length || 0}`);
  const favs = await fetchJSON(BASE + '/api/favourites');
  console.log(`   Favourite entries: ${favs.data?.counts?.length || 0}`);
}

main().catch(console.error);
