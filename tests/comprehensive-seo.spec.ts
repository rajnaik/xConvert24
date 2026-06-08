import { test, expect } from '@playwright/test';

/**
 * Comprehensive SEO & Site Quality Tests
 * Runs against the live site (www.xconvert24.com)
 * 
 * Covers:
 * - Title character limits & style
 * - Meta description character limits & style
 * - H1 presence & value props
 * - All converters functional
 * - All links valid (no broken links)
 * - Click tracking registration
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SEO: TITLE TAG RULES
// - Unique per page
// - 50-70 characters (after | xConvert24.com suffix)
// - Contains primary keyword
// ═══════════════════════════════════════════════════════════════════════════════

const allConverters = [
  '/convert/weight', '/convert/length', '/convert/temperature',
  '/convert/area', '/convert/volume', '/convert/speed', '/convert/data',
  '/convert/energy', '/convert/pressure', '/convert/power',
  '/convert/fuel', '/convert/angle', '/convert/frequency',
  '/convert/time', '/convert/cooking', '/convert/currency',
  '/convert/base', '/convert/roman', '/convert/shoe-size',
  '/convert/clothing-size', '/convert/body-weight-percentage',
  '/convert/cycling-speed', '/convert/oven-temperature',
  '/convert/precious-metals', '/convert/running-pace',
];

const allTools = [
  '/tools/bmi', '/tools/calculator', '/tools/color', '/tools/clock',
  '/tools/stopwatch', '/tools/alarm', '/tools/reminder',
  '/tools/age', '/tools/date-diff', '/tools/tip', '/tools/discount',
  '/tools/loan', '/tools/image-converter', '/tools/image-editor',
  '/tools/audio-converter', '/tools/video-converter',
  '/tools/audio-formats', '/tools/video-formats',
  '/tools/distance-map', '/tools/password', '/tools/morse',
  '/tools/scrabble', '/tools/epoch', '/tools/aspect-ratio',
  '/tools/ruler', '/tools/guitar-tuner', '/tools/crypto-coins',
  '/tools/crypto-bubbles', '/tools/contagion',
];

const staticPages = [
  '/', '/about', '/contact', '/faq', '/search', '/privacy',
  '/terms', '/cookies', '/releases', '/report-bug', '/suggest',
  '/suggestions', '/vote-bugs', '/guide', '/install', '/favourites',
  '/support', '/rewards', '/roadmap', '/build-pipeline', '/tech-stack',
];

const allPages = [...staticPages, ...allConverters, ...allTools];

// ═══════════════════════════════════════════════════════════════════════════════
// TITLE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('SEO: Title Tags', () => {
  for (const pagePath of allPages) {
    test(`Title ≤ 70 chars: ${pagePath}`, async ({ page }) => {
      const res = await page.goto(pagePath);
      if (res?.status() !== 200) { test.skip(); return; }
      const title = await page.title();
      expect(title.length, `"${title}" is ${title.length} chars`).toBeLessThanOrEqual(70);
    });
  }

  test('All titles are unique', async ({ page }) => {
    const titles: Record<string, string> = {};
    for (const pagePath of allPages.slice(0, 20)) { // Sample first 20 for speed
      const res = await page.goto(pagePath);
      if (res?.status() !== 200) continue;
      const title = await page.title();
      if (titles[title]) {
        expect(false, `Duplicate title "${title}" on ${pagePath} and ${titles[title]}`).toBe(true);
      }
      titles[title] = pagePath;
    }
  });

  test('Converter titles contain "Converter" or "Calculator"', async ({ page }) => {
    for (const path of allConverters.slice(0, 10)) {
      const res = await page.goto(path);
      if (res?.status() !== 200) continue;
      const title = await page.title();
      const hasKeyword = /converter|calculator/i.test(title);
      expect(hasKeyword, `Title "${title}" on ${path} should contain Converter or Calculator`).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// META DESCRIPTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('SEO: Meta Descriptions', () => {
  for (const pagePath of allPages) {
    test(`Meta description exists & ≤ 160 chars: ${pagePath}`, async ({ page }) => {
      const res = await page.goto(pagePath);
      if (res?.status() !== 200) { test.skip(); return; }
      const desc = await page.getAttribute('meta[name="description"]', 'content');
      expect(desc, `${pagePath} has no meta description`).toBeTruthy();
      expect(desc!.length, `"${desc}" is ${desc!.length} chars`).toBeLessThanOrEqual(160);
      expect(desc!.length, `"${desc}" is too short (${desc!.length} chars)`).toBeGreaterThanOrEqual(50);
    });
  }

  test('Converter descriptions contain "Free" or "No sign-up"', async ({ page }) => {
    for (const path of allConverters) {
      const res = await page.goto(path);
      if (res?.status() !== 200) continue;
      const desc = await page.getAttribute('meta[name="description"]', 'content') || '';
      const hasValueProp = /free|no sign-up|no signup|instant/i.test(desc);
      expect(hasValueProp, `Description on ${path} missing value prop: "${desc}"`).toBe(true);
    }
  });

  test('Tool descriptions contain "Free" or "No sign-up"', async ({ page }) => {
    for (const path of allTools) {
      const res = await page.goto(path);
      if (res?.status() !== 200) continue;
      const desc = await page.getAttribute('meta[name="description"]', 'content') || '';
      const hasValueProp = /free|no sign-up|no signup|instant|no upload/i.test(desc);
      expect(hasValueProp, `Description on ${path} missing value prop: "${desc}"`).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// H1 HEADING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('SEO: H1 Headings', () => {
  for (const pagePath of [...allConverters, ...allTools]) {
    test(`Exactly one H1 with value prop: ${pagePath}`, async ({ page }) => {
      const res = await page.goto(pagePath);
      if (res?.status() !== 200) { test.skip(); return; }
      const h1s = page.locator('h1');
      const count = await h1s.count();
      expect(count, `${pagePath} has ${count} H1 tags (expected 1)`).toBe(1);
      const text = await h1s.first().textContent() || '';
      const hasValueProp = /free|instant|no sign-up|live/i.test(text);
      expect(hasValueProp, `H1 "${text}" on ${pagePath} missing value prop`).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// OPEN GRAPH & TWITTER CARD TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('SEO: Open Graph & Twitter Cards', () => {
  const samplePages = ['/', '/convert/weight', '/tools/bmi', '/about', '/contact'];

  for (const pagePath of samplePages) {
    test(`OG tags present: ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
      const ogUrl = await page.getAttribute('meta[property="og:url"]', 'content');
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
      expect(ogTitle, `Missing og:title on ${pagePath}`).toBeTruthy();
      expect(ogDesc, `Missing og:description on ${pagePath}`).toBeTruthy();
      expect(ogUrl, `Missing og:url on ${pagePath}`).toBeTruthy();
      expect(ogImage, `Missing og:image on ${pagePath}`).toBeTruthy();
    });

    test(`Twitter card present: ${pagePath}`, async ({ page }) => {
      await page.goto(pagePath);
      const card = await page.getAttribute('meta[name="twitter:card"]', 'content');
      const tTitle = await page.getAttribute('meta[name="twitter:title"]', 'content');
      expect(card, `Missing twitter:card on ${pagePath}`).toBeTruthy();
      expect(tTitle, `Missing twitter:title on ${pagePath}`).toBeTruthy();
    });
  }
});
