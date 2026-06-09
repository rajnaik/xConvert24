import { test, expect } from '@playwright/test';

/**
 * Functional tests for ALL converters.
 * Verifies each converter loads, accepts input, and produces output.
 */

const converterTests = [
  { path: '/convert/weight', from: 'kg', to: 'lb', input: '1', expected: 2.205, tolerance: 0.01 },
  { path: '/convert/weight', from: 'lb', to: 'kg', input: '10', expected: 4.536, tolerance: 0.01 },
  { path: '/convert/length', from: 'km', to: 'mi', input: '1', expected: 0.6214, tolerance: 0.01 },
  { path: '/convert/length', from: 'ft', to: 'cm', input: '6', expected: 182.88, tolerance: 0.01 },
  { path: '/convert/temperature', from: 'c', to: 'f', input: '100', expected: 212, tolerance: 0 },
  { path: '/convert/temperature', from: 'f', to: 'c', input: '32', expected: 0, tolerance: 0 },
  { path: '/convert/temperature', from: 'c', to: 'k', input: '0', expected: 273.15, tolerance: 0.01 },
  { path: '/convert/area', from: 'm2', to: 'ft2', input: '1', expected: 10.764, tolerance: 0.01 },
  { path: '/convert/volume', from: 'l', to: 'gal_us', input: '1', expected: 0.2642, tolerance: 0.01 },
  { path: '/convert/speed', from: 'kmh', to: 'mph', input: '100', expected: 62.137, tolerance: 0.01 },
  { path: '/convert/data', from: 'GB', to: 'MB', input: '1', expected: 1000, tolerance: 0 },
  { path: '/convert/energy', from: 'kwh', to: 'j', input: '1', expected: 3600000, tolerance: 0 },
  { path: '/convert/pressure', from: 'atm', to: 'psi', input: '1', expected: 14.696, tolerance: 0.01 },
  { path: '/convert/power', from: 'kw', to: 'hp', input: '1', expected: 1.341, tolerance: 0.01 },
  { path: '/convert/fuel', from: 'mpg_us', to: 'l100km', input: '30', expected: 7.84, tolerance: 0.1 },
  { path: '/convert/time', from: 'h', to: 'min', input: '2', expected: 120, tolerance: 0 },
  { path: '/convert/angle', from: 'deg', to: 'rad', input: '180', expected: 3.1416, tolerance: 0.001 },
  { path: '/convert/frequency', from: 'mhz', to: 'khz', input: '1', expected: 1000, tolerance: 0 },
];

test.describe('Converters: Functional Accuracy', () => {
  for (const tc of converterTests) {
    test(`${tc.path}: ${tc.input} ${tc.from} → ${tc.to} ≈ ${tc.expected}`, async ({ page }) => {
      await page.goto(tc.path, { waitUntil: 'domcontentloaded' });
      
      const fromUnit = page.locator('#from-unit');
      const toUnit = page.locator('#to-unit');
      const fromValue = page.locator('#from-value');
      const result = page.locator('#result');

      await fromUnit.selectOption(tc.from);
      await toUnit.selectOption(tc.to);
      await fromValue.fill(tc.input);
      
      // Wait for result to update (some converters compute async)
      await page.waitForFunction(
        (sel) => {
          const el = document.querySelector(sel);
          return el && el.textContent && el.textContent.trim() !== '' && el.textContent.trim() !== '—';
        },
        '#result',
        { timeout: 5000 }
      );

      const text = await result.textContent();
      const num = parseFloat(text || '0');
      expect(num).toBeCloseTo(tc.expected, tc.tolerance === 0 ? 0 : 1);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ALL CONVERTER PAGES LOAD & HAVE UI ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

const allConverterPaths = [
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

test.describe('Converters: UI Elements Present', () => {
  for (const path of allConverterPaths) {
    test(`${path} has converter UI`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);

      // All converters should have at least: input field, some kind of result area
      const hasInput = await page.locator('input, select').count();
      expect(hasInput, `${path} has no input elements`).toBeGreaterThan(0);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SWAP BUTTON WORKS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Converters: Swap Button', () => {
  const swapTests = ['/convert/weight', '/convert/length', '/convert/temperature', '/convert/speed', '/convert/volume'];

  for (const path of swapTests) {
    test(`Swap works on ${path}`, async ({ page }) => {
      await page.goto(path);
      const fromUnit = page.locator('#from-unit');
      const toUnit = page.locator('#to-unit');
      const swapBtn = page.locator('#swap-btn');

      const originalFrom = await fromUnit.inputValue();
      const originalTo = await toUnit.inputValue();

      await swapBtn.click();
      await page.waitForTimeout(200);

      const newFrom = await fromUnit.inputValue();
      const newTo = await toUnit.inputValue();

      expect(newFrom).toBe(originalTo);
      expect(newTo).toBe(originalFrom);
    });
  }
});
