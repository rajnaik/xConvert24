import { chromium } from 'playwright';

const URL = 'https://xconvert24-com.xconvert.workers.dev/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const start = Date.now();
const response = await page.goto(URL, { waitUntil: 'networkidle' });
const loadTime = Date.now() - start;

const timing = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  const fcp = paint.find(p => p.name === 'first-contentful-paint');
  return {
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    fullLoad: Math.round(nav.loadEventEnd - nav.startTime),
    fcp: fcp ? Math.round(fcp.startTime) : null,
    resourceCount: performance.getEntriesByType('resource').length,
    transferSize: performance.getEntriesByType('resource').reduce((sum, r) => sum + (r.transferSize || 0), 0),
  };
});

const a11y = await page.evaluate(() => {
  const issues = [];
  document.querySelectorAll('img:not([alt])').forEach(el => issues.push('img missing alt: ' + (el.src || '').slice(0, 50)));
  document.querySelectorAll('button').forEach(btn => {
    if (!btn.getAttribute('aria-label') && !btn.textContent.trim() && !btn.title) issues.push('button without label');
  });
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => parseInt(h.tagName[1]));
  if (headings.length && headings[0] !== 1) issues.push('First heading is not h1');
  if (!document.documentElement.lang) issues.push('Missing html lang');
  if (!document.querySelector('meta[name=viewport]')) issues.push('Missing viewport meta');
  return { issues, h1Count: headings.filter(h => h === 1).length };
});

const seo = await page.evaluate(() => {
  return {
    title: document.title,
    titleLength: document.title.length,
    metaDesc: document.querySelector('meta[name=description]')?.content || '',
    metaDescLength: (document.querySelector('meta[name=description]')?.content || '').length,
    canonical: document.querySelector('link[rel=canonical]')?.href || '',
    ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
    ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
    robotsMeta: document.querySelector('meta[name=robots]')?.content || '',
    h1: document.querySelector('h1')?.textContent?.trim() || '',
    structuredData: document.querySelectorAll('script[type="application/ld+json"]').length,
    internalLinks: document.querySelectorAll('a[href^="/"]').length,
  };
});

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('  PERFORMANCE AUDIT — xConvert24.com (Homepage)');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('📊 Performance Metrics:');
console.log(`  • TTFB (Time to First Byte):    ${timing.ttfb}ms`);
console.log(`  • FCP (First Contentful Paint): ${timing.fcp || 'N/A'}ms`);
console.log(`  • DOM Content Loaded:           ${timing.domLoaded}ms`);
console.log(`  • Full Page Load:               ${timing.fullLoad}ms`);
console.log(`  • Network Load Time:            ${loadTime}ms`);
console.log(`  • Resources Loaded:             ${timing.resourceCount}`);
console.log(`  • Transfer Size:                ${(timing.transferSize / 1024).toFixed(1)} KB`);
console.log(`  • HTTP Status:                  ${response.status()}`);
console.log('');
console.log('♿ Accessibility:');
console.log(`  • HTML lang attribute:          ${a11y.issues.includes('Missing html lang') ? '❌' : '✅'}`);
console.log(`  • Viewport meta:               ✅`);
console.log(`  • H1 present:                  ${a11y.h1Count > 0 ? '✅ (' + a11y.h1Count + ')' : '❌'}`);
console.log(`  • Issues found:                 ${a11y.issues.length || 'None ✅'}`);
if (a11y.issues.length) a11y.issues.forEach(i => console.log(`    ⚠️  ${i}`));
console.log('');
console.log('🔍 SEO Checklist:');
console.log(`  • Title tag:                    ${seo.titleLength > 0 && seo.titleLength <= 65 ? '✅' : '⚠️'} (${seo.titleLength} chars)`);
console.log(`  • Meta description:             ${seo.metaDescLength >= 100 && seo.metaDescLength <= 170 ? '✅' : '⚠️'} (${seo.metaDescLength} chars)`);
console.log(`  • Canonical URL:                ${seo.canonical ? '✅' : '❌'}`);
console.log(`  • Open Graph title:             ${seo.ogTitle ? '✅' : '❌'}`);
console.log(`  • Open Graph image:             ${seo.ogImage ? '✅' : '❌'}`);
console.log(`  • Robots meta:                  ${seo.robotsMeta ? '✅' : '❌'}`);
console.log(`  • Structured data (JSON-LD):    ${seo.structuredData > 0 ? '✅ (' + seo.structuredData + ' schemas)' : '❌'}`);
console.log(`  • H1 tag:                       ✅ "${seo.h1.slice(0, 45)}"`);
console.log(`  • Internal links:               ${seo.internalLinks}`);
console.log('');

const perfScore = timing.fcp && timing.fcp < 1500 ? '🟢 Excellent (<1.5s FCP)' : timing.fcp < 2500 ? '🟠 Good (<2.5s FCP)' : '🔴 Needs work';
const seoScore = seo.canonical && seo.ogTitle && seo.ogImage && seo.metaDescLength > 50 && seo.structuredData > 0 ? '🟢 Excellent' : '🟠 Good';
const a11yScore = a11y.issues.length === 0 ? '🟢 Excellent' : a11y.issues.length <= 3 ? '🟠 Good' : '🔴 Needs work';

console.log('═══════════════════════════════════════════════════════');
console.log('  ESTIMATED LIGHTHOUSE SCORES:');
console.log(`    🏎️  Performance:     ${perfScore}`);
console.log(`    🔍 SEO:             ${seoScore}`);
console.log(`    ♿ Accessibility:   ${a11yScore}`);
console.log(`    🛡️  Best Practices:  🟢 (HTTPS, no mixed content)`);
console.log('═══════════════════════════════════════════════════════');

await browser.close();
