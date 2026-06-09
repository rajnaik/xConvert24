import { test, expect } from '@playwright/test';

/**
 * CrossCoupling — Suggest Feature Link Tests
 * Verifies that clicking "Suggest a new feature for this tool" on converter pages
 * navigates to /suggest and prefills the "What would you like us to add?" field
 * with the converter name.
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

test.describe('CrossCoupling: Suggest Feature Link on Converters', () => {
  // Test a sample of converters (first 5) for quick CI, plus spot-check edges
  const sampleConverters = [
    converters[0],  // weight
    converters[1],  // length
    converters[3],  // currency
    converters[7],  // data (multi-word name)
    converters[20], // body-weight-percentage (long name)
  ];

  for (const { path, name } of sampleConverters) {
    test(`${path} suggest link prefills "${name}"`, async ({ page }) => {
      // Navigate to the converter page
      await page.goto(path);

      // Find the suggest link (may need scrolling on long pages)
      const suggestLink = page.locator('a[href*="/suggest?title="]').first();
      await expect(suggestLink).toBeAttached();

      // Scroll to it and verify it becomes visible
      await suggestLink.scrollIntoViewIfNeeded();
      await expect(suggestLink).toBeVisible();

      // Verify link text
      await expect(suggestLink).toContainText('Suggest a new feature for this tool');

      // Click the link and wait for navigation
      await Promise.all([
        page.waitForURL(/\/suggest\/?\?title=/, { waitUntil: 'domcontentloaded' }),
        suggestLink.click(),
      ]);

      // Verify we're on the suggest page
      expect(page.url()).toMatch(/\/suggest\/?\?title=/);

      // Verify the input field is prefilled with the converter name
      const titleInput = page.locator('#sug-title');
      await expect(titleInput).toHaveValue(name);
    });
  }

  test('all converters have a suggest link present', async ({ page }) => {
    for (const { path } of converters) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);

      const suggestLink = page.locator('a[href*="/suggest?title="]').first();
      await expect(suggestLink, `${path} should have a suggest link`).toBeAttached();
    }
  });
});
