import { test, expect } from '@playwright/test';

/**
 * Bug Report Link Tests
 * Verifies that clicking "🐛 Report a bug" on converter/tool pages
 * navigates to /report-bug and prefills the tool selector with the correct name.
 */

const converters = [
  { path: '/convert/weight', name: 'Weight Converter' },
  { path: '/convert/length', name: 'Length Converter' },
  { path: '/convert/temperature', name: 'Temperature Converter' },
  { path: '/convert/currency', name: 'Currency Converter' },
  { path: '/convert/area', name: 'Area Converter' },
  { path: '/convert/volume', name: 'Volume Converter' },
  { path: '/convert/speed', name: 'Speed Converter' },
  { path: '/convert/data', name: 'Data Storage Converter' },
  { path: '/convert/energy', name: 'Energy Converter' },
  { path: '/convert/pressure', name: 'Pressure Converter' },
  { path: '/convert/power', name: 'Power Converter' },
  { path: '/convert/fuel', name: 'Fuel Economy Converter' },
  { path: '/convert/angle', name: 'Angle Converter' },
  { path: '/convert/frequency', name: 'Frequency Converter' },
  { path: '/convert/time', name: 'Time Converter' },
  { path: '/convert/cooking', name: 'Cooking Converter' },
  { path: '/convert/base', name: 'Number Base Converter' },
  { path: '/convert/roman', name: 'Roman Numeral Converter' },
  { path: '/convert/shoe-size', name: 'Shoe Size Converter' },
  { path: '/convert/clothing-size', name: 'Clothing Size Converter' },
  { path: '/convert/body-weight-percentage', name: 'Body Weight Percentage Calculator' },
  { path: '/convert/cycling-speed', name: 'Cycling Speed Calculator' },
  { path: '/convert/oven-temperature', name: 'Oven Temperature Converter' },
  { path: '/convert/precious-metals', name: 'Precious Metals Converter' },
  { path: '/convert/running-pace', name: 'Running Pace Calculator' },
];

const tools = [
  { path: '/tools/scrabble', name: 'Free Scrabble Word Finder' },
  { path: '/tools/age', name: 'Age Calculator' },
  { path: '/tools/alarm', name: 'Alarm Clock' },
  { path: '/tools/aspect-ratio', name: 'Aspect Ratio Calculator' },
  { path: '/tools/audio-converter', name: 'Audio Converter' },
  { path: '/tools/audio-formats', name: 'Audio Formats Guide' },
  { path: '/tools/bmi', name: 'BMI Calculator' },
  { path: '/tools/calculator', name: 'Scientific Calculator' },
  { path: '/tools/clock', name: 'World Clock' },
  { path: '/tools/color', name: 'Color Picker' },
  { path: '/tools/contagion', name: 'Contagion Tracker' },
  { path: '/tools/crypto-bubbles', name: 'Crypto Bubbles' },
  { path: '/tools/crypto-coins', name: 'Top 100 Crypto' },
  { path: '/tools/date-diff', name: 'Date Difference Calculator' },
  { path: '/tools/discount', name: 'Discount Calculator' },
  { path: '/tools/distance-map', name: 'Map Tools' },
  { path: '/tools/epoch', name: 'Epoch Converter' },
  { path: '/tools/guitar-tuner', name: 'Guitar Tuner' },
  { path: '/tools/image-converter', name: 'Image Converter' },
  { path: '/tools/image-editor', name: 'Image Editor' },
  { path: '/tools/loan', name: 'Loan Calculator' },
  { path: '/tools/morse', name: 'Morse Code Translator' },
  { path: '/tools/my-ip', name: 'Show My IP Address' },
  { path: '/tools/password', name: 'Password Generator' },
  { path: '/tools/reminder', name: 'Reminder' },
  { path: '/tools/ruler', name: 'Online Ruler' },
  { path: '/tools/stopwatch', name: 'Stopwatch' },
  { path: '/tools/tip', name: 'Tip Calculator' },
  { path: '/tools/video-converter', name: 'Video Converter' },
  { path: '/tools/video-formats', name: 'Video Formats Guide' },
];

const allPages = [...converters, ...tools];

test.describe('Bug Report Link on Converters & Tools', () => {
  // Test a sample for full prefill verification
  const sample = [
    converters[0],  // weight
    converters[3],  // currency
    converters[7],  // data (multi-word)
    tools[0],       // scrabble
    tools[6],       // bmi
  ];

  for (const { path, name } of sample) {
    test(`${path} bug link prefills "${name}"`, async ({ page }) => {
      await page.goto(path);

      const bugLink = page.locator('a[href*="/report-bug?tool="]').first();
      await expect(bugLink).toBeAttached();
      await bugLink.scrollIntoViewIfNeeded();
      await expect(bugLink).toBeVisible();
      await expect(bugLink).toContainText('Report a bug');

      // Click and navigate
      await Promise.all([
        page.waitForURL(/\/report-bug\/?\?tool=/, { waitUntil: 'domcontentloaded' }),
        bugLink.click(),
      ]);

      // Verify we're on report-bug with the tool param
      expect(page.url()).toMatch(/\/report-bug\/?\?tool=/);

      // Verify the tool is pre-selected (shown in badge) or prefilled in search input
      const selectedBadge = page.locator('#bug-selected-name');
      const searchInput = page.locator('#bug-search-input');
      const badgeVisible = await selectedBadge.isVisible().catch(() => false);
      if (badgeVisible) {
        await expect(selectedBadge).toHaveText(name);
      } else {
        await expect(searchInput).toHaveValue(name);
      }
    });
  }

  test('all converters have a bug report link', async ({ page }) => {
    for (const { path } of converters) {
      await page.goto(path);
      const bugLink = page.locator('a[href*="/report-bug?tool="]').first();
      await expect(bugLink, `${path} should have a bug report link`).toBeAttached();
    }
  });

  test('all tools have a bug report link', async ({ page }) => {
    for (const { path } of tools) {
      await page.goto(path);
      const bugLink = page.locator('a[href*="/report-bug?tool="]').first();
      await expect(bugLink, `${path} should have a bug report link`).toBeAttached();
    }
  });
});
