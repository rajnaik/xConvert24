import { test, expect } from '@playwright/test';

/**
 * SEO Test: All page titles must be ≤ 70 characters.
 * Titles longer than 70 chars may be truncated by search engines.
 */

const allPages = [
  '/', '/about', '/contact', '/faq', '/search', '/privacy', '/terms',
  '/cookies', '/profile', '/rewards', '/report-bug', '/suggest',
  '/suggestions', '/vote-bugs', '/releases', '/guide', '/install',
  '/favourites', '/support',
  // Converters
  '/convert/weight', '/convert/length', '/convert/temperature',
  '/convert/area', '/convert/volume', '/convert/speed', '/convert/data',
  '/convert/currency', '/convert/time', '/convert/cooking',
  '/convert/energy', '/convert/pressure', '/convert/power',
  '/convert/fuel', '/convert/angle', '/convert/frequency',
  '/convert/base', '/convert/roman', '/convert/shoe-size',
  '/convert/clothing-size',
  // Tools
  '/tools/bmi', '/tools/calculator', '/tools/color', '/tools/clock',
  '/tools/stopwatch', '/tools/alarm', '/tools/reminder',
  '/tools/age', '/tools/date-diff', '/tools/tip', '/tools/discount',
  '/tools/loan', '/tools/image-converter', '/tools/image-editor',
  '/tools/audio-converter', '/tools/video-converter',
  '/tools/distance-map', '/tools/password', '/tools/morse',
  '/tools/scrabble', '/tools/epoch', '/tools/aspect-ratio',
  '/tools/ruler', '/tools/guitar-tuner', '/tools/crypto-coins',
  '/tools/crypto-bubbles', '/tools/contagion',
];

const MAX_TITLE_LENGTH = 70;

for (const pagePath of allPages) {
  test(`Title length ≤ ${MAX_TITLE_LENGTH} chars: ${pagePath}`, async ({ page }) => {
    const res = await page.goto(pagePath);
    if (res?.status() !== 200) {
      test.skip();
      return;
    }

    const title = await page.title();
    expect(
      title.length,
      `Title "${title}" is ${title.length} chars (max ${MAX_TITLE_LENGTH})`
    ).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
  });
}
