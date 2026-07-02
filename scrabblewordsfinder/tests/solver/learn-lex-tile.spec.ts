import { test, expect } from '@playwright/test';

/**
 * Learn with Lex AI Tile — Inside Lex AI Solver Modal
 *
 * Tests for the "Learn with Lex AI" link tile that sits beside the
 * "Find Words" button inside the Lex AI Solver modal. It has a purple border,
 * larger Lex avatar enclosed in the border, and links to /chat/.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Learn with Lex AI Tile — Positive', () => {
  test('tile exists inside the Lex solver modal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Open the Lex solver modal
    await page.locator('#ask-lex-tile').click();
    const tile = page.locator('#learn-lex-modal-link');
    await expect(tile).toHaveCount(1);
    await expect(tile).toBeVisible();
  });

  test('tile is an <a> link pointing to /chat/', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    const tile = page.locator('a#learn-lex-modal-link');
    await expect(tile).toHaveCount(1);
    const href = await tile.getAttribute('href');
    expect(href).toBe('/chat/');
  });

  test('tile has correct label text', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    const label = page.locator('#learn-lex-modal-link span');
    await expect(label).toHaveText('Learn with Lex AI');
  });

  test('tile has Lex avatar image (28px, enclosed in border)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    const avatar = page.locator('#learn-lex-modal-link img');
    await expect(avatar).toHaveCount(1);
    await expect(avatar).toHaveAttribute('alt', 'Lex');
    await expect(avatar).toHaveAttribute('width', '28');
    const cls = await avatar.getAttribute('class');
    expect(cls).toContain('border-2');
    expect(cls).toContain('border-purple-400');
  });

  test('tile has purple border styling', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    const tile = page.locator('#learn-lex-modal-link');
    const cls = await tile.getAttribute('class');
    expect(cls).toContain('border-purple-500');
    expect(cls).toContain('border-2');
  });

  test('tile label text is purple-300', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    const label = page.locator('#learn-lex-modal-link span');
    const cls = await label.getAttribute('class');
    expect(cls).toContain('text-purple-300');
  });

  test('tile navigates to /chat/ on click', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#learn-lex-modal-link').click();
    await page.waitForURL('**/chat/');
    expect(page.url()).toContain('/chat/');
  });
});

test.describe('Learn with Lex AI Tile — Negative', () => {
  test('no duplicate tiles on the page', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tiles = page.locator('#learn-lex-modal-link');
    const count = await tiles.count();
    expect(count).toBe(1);
  });

  test('tile does not crash page on click', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#learn-lex-modal-link').click();
    await page.waitForTimeout(1000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('tile does not have broken image (avatar loads)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    const avatar = page.locator('#learn-lex-modal-link img');
    const naturalWidth = await avatar.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('tile href includes trailing slash', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const href = await page.locator('#learn-lex-modal-link').getAttribute('href');
    expect(href).toMatch(/\/$/);
  });
});
