import { readFileSync } from 'fs';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4322';
const pagesFile = new URL('./pages-list.txt', import.meta.url.replace('/scripts/', '/')).pathname;

// Generate pages list from the provided file or use inline list
let pagesRaw;
try {
  pagesRaw = readFileSync(pagesFile, 'utf-8').trim().split('\n');
} catch {
  // Fallback: read from /tmp
  pagesRaw = readFileSync('/tmp/swf-pages.txt', 'utf-8').trim().split('\n');
}

const results = {
  total: 0,
  httpErrors: [],
  missingTitle: [],
  missingDescription: [],
  missingCanonical: [],
  missingOg: [],
  missingFaq: [],
  thinPages: [],
  slowPages: [],
};

const BATCH = 5;
const DELAY_MS = 300; // delay between batches to avoid overwhelming dev server
const MAX_RETRIES = 2; // retry failed requests once
for (let i = 0; i < pagesRaw.length; i += BATCH) {
  const batch = pagesRaw.slice(i, i + BATCH);
  const promises = batch.map(async (page) => {
    results.total++;
    const url = `${BASE}${page}`;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const start = Date.now();
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const elapsed = Date.now() - start;

        if (res.status !== 200) {
          if (attempt < MAX_RETRIES && res.status === 500) {
            await new Promise(r => setTimeout(r, 1000)); // wait before retry
            continue;
          }
          results.httpErrors.push(`${page} → ${res.status}`);
          return;
        }

        const body = await res.text();

        if (!/<title>/i.test(body)) results.missingTitle.push(page);
        if (!/name=["']description["']/i.test(body)) results.missingDescription.push(page);
        if (!/rel=["']canonical["']/i.test(body)) results.missingCanonical.push(page);
        if (!/property=["']og:title["']/i.test(body)) results.missingOg.push(page);

        if (page !== '/' && page !== '/blog/') {
          if (!/FAQPage/i.test(body)) results.missingFaq.push(page);
        }

        const text = body
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ');
        const words = text.split(/\s+/).filter(w => w.length > 0).length;
        if (words < 150) results.thinPages.push(`${page} (${words} words)`);

        if (elapsed > 500) results.slowPages.push(`${page} (${elapsed}ms)`);
        return; // success, don't retry
      } catch (e) {
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        results.httpErrors.push(`${page} → TIMEOUT/ERROR`);
      }
    }
  });
  await Promise.all(promises);

  // Small delay between batches to avoid overwhelming dev server
  await new Promise(r => setTimeout(r, DELAY_MS));

  if ((i + BATCH) % 50 === 0 || i + BATCH >= pagesRaw.length) {
    process.stderr.write(`  Checked ${i + BATCH}/${pagesRaw.length}...\n`);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  SEO HEALTH CHECK — ScrabbleWordsFinder.com (localhost)`);
console.log(`${'═'.repeat(60)}\n`);
console.log(`Pages checked: ${results.total}`);
console.log(`HTTP errors: ${results.httpErrors.length}`);
console.log(`Missing <title>: ${results.missingTitle.length}`);
console.log(`Missing meta description: ${results.missingDescription.length}`);
console.log(`Missing canonical: ${results.missingCanonical.length}`);
console.log(`Missing og:title: ${results.missingOg.length}`);
console.log(`Missing FAQPage schema: ${results.missingFaq.length}`);
console.log(`Thin pages (<150 words): ${results.thinPages.length}`);
console.log(`Slow pages (>500ms): ${results.slowPages.length}`);

if (results.httpErrors.length) {
  console.log(`\n--- HTTP Errors (${results.httpErrors.length}) ---`);
  results.httpErrors.slice(0, 20).forEach(p => console.log(`  ❌ ${p}`));
  if (results.httpErrors.length > 20) console.log(`  ... and ${results.httpErrors.length - 20} more`);
}
if (results.missingTitle.length) {
  console.log(`\n--- Missing <title> (${results.missingTitle.length}) ---`);
  results.missingTitle.slice(0, 10).forEach(p => console.log(`  ⚠️  ${p}`));
}
if (results.missingDescription.length) {
  console.log(`\n--- Missing meta description (${results.missingDescription.length}) ---`);
  results.missingDescription.slice(0, 10).forEach(p => console.log(`  ⚠️  ${p}`));
}
if (results.missingCanonical.length) {
  console.log(`\n--- Missing canonical (${results.missingCanonical.length}) ---`);
  results.missingCanonical.slice(0, 10).forEach(p => console.log(`  ⚠️  ${p}`));
}
if (results.missingOg.length) {
  console.log(`\n--- Missing og:title (${results.missingOg.length}) ---`);
  results.missingOg.slice(0, 10).forEach(p => console.log(`  ⚠️  ${p}`));
}
if (results.missingFaq.length) {
  console.log(`\n--- Missing FAQPage schema (${results.missingFaq.length}) ---`);
  results.missingFaq.slice(0, 30).forEach(p => console.log(`  ⚠️  ${p}`));
  if (results.missingFaq.length > 30) console.log(`  ... and ${results.missingFaq.length - 30} more`);
}
if (results.thinPages.length) {
  console.log(`\n--- Thin pages <150 words (${results.thinPages.length}) ---`);
  results.thinPages.slice(0, 15).forEach(p => console.log(`  ⚠️  ${p}`));
  if (results.thinPages.length > 15) console.log(`  ... and ${results.thinPages.length - 15} more`);
}
if (results.slowPages.length) {
  console.log(`\n--- Slow pages >500ms (${results.slowPages.length}) ---`);
  results.slowPages.slice(0, 15).forEach(p => console.log(`  🐌 ${p}`));
  if (results.slowPages.length > 15) console.log(`  ... and ${results.slowPages.length - 15} more`);
}

const issues = results.httpErrors.length + results.missingTitle.length + results.missingDescription.length + results.missingCanonical.length + results.missingOg.length + results.thinPages.length;
const score = Math.max(0, Math.round((1 - issues / results.total) * 100));
console.log(`\n${'═'.repeat(60)}`);
console.log(`  SCORE: ${score}/100 (${issues} critical issues across ${results.total} pages)`);
console.log(`  FAQPage coverage: ${results.total - results.missingFaq.length - 2}/${results.total - 2} pages`);
console.log(`${'═'.repeat(60)}\n`);
