import { test, expect } from '@playwright/test';

/**
 * Homepage Accessibility Tests
 * Verifies accessible labels, ARIA attributes, and screen-reader support
 * on the SWF homepage solver interface.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Homepage Accessibility — Positive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('tiles-in-bag input has an associated sr-only label', async ({ page }) => {
    const label = page.locator('label[for="tiles-in-bag"]');
    await expect(label).toBeAttached();
    await expect(label).toHaveClass(/sr-only/);
    await expect(label).toHaveText('Tiles in bag');
  });

  test('tiles-in-bag input is accessible via its label', async ({ page }) => {
    // The input should be findable by its label text (provided by <label for>)
    const input = page.getByLabel('Tiles in bag');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('id', 'tiles-in-bag');
  });
});

test.describe('Homepage Accessibility — Negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('no duplicate labels for tiles-in-bag', async ({ page }) => {
    const labels = page.locator('label[for="tiles-in-bag"]');
    await expect(labels).toHaveCount(1);
  });

  test('sr-only label is visually hidden but present in DOM', async ({ page }) => {
    const label = page.locator('label[for="tiles-in-bag"]');
    // sr-only elements are in the DOM but not visually visible
    await expect(label).toBeAttached();
    const box = await label.boundingBox();
    // sr-only typically makes the element 1x1px or clipped — either way, effectively invisible
    expect(box === null || (box.width <= 1 && box.height <= 1) || box.width * box.height <= 1).toBeTruthy();
  });

  test('tiles-in-bag input has no redundant aria-label (uses label[for] only)', async ({ page }) => {
    const input = page.locator('#tiles-in-bag');
    await expect(input).not.toHaveAttribute('aria-label');
  });
});
