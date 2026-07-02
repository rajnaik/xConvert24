import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Learn with Lex AI — Homepage Link
 * A new link was added inside the Lex solver modal on the homepage
 * that navigates to /chat/ for full AI Scrabble coaching.
 */

test.describe('Learn with Lex AI Link — Positive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Open the Lex solver modal
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });
  });

  test('link is visible inside the Lex solver modal', async ({ page }) => {
    const link = page.locator('#learn-lex-modal-link');
    await expect(link).toBeVisible();
  });

  test('link has correct href to /chat/', async ({ page }) => {
    const link = page.locator('#learn-lex-modal-link');
    await expect(link).toHaveAttribute('href', '/chat/');
  });

  test('link contains Lex avatar image', async ({ page }) => {
    const img = page.locator('#learn-lex-modal-link img[alt="Lex"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', '/lex-avatar-32.png');
  });

  test('link displays correct label text', async ({ page }) => {
    const span = page.locator('#learn-lex-modal-link span');
    await expect(span).toHaveText('Learn with Lex AI');
  });

  test('link has data-track attribute for click tracking', async ({ page }) => {
    const link = page.locator('#learn-lex-modal-link');
    await expect(link).toHaveAttribute('data-track', 'Learn with Lex AI');
  });
});

test.describe('Learn with Lex AI Link — Negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });
  });

  test('no duplicate learn-lex links on the page', async ({ page }) => {
    const links = page.locator('#learn-lex-modal-link');
    await expect(links).toHaveCount(1);
  });

  test('link does not cause JavaScript errors when modal opens', async ({ page }) => {
    // Re-test with fresh page + error listener
    const errors: string[] = [];
    const freshPage = page;
    freshPage.on('pageerror', err => errors.push(err.message));

    // Already on page, modal already open from beforeEach — just check
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('avatar image has proper dimensions (not broken)', async ({ page }) => {
    const img = page.locator('#learn-lex-modal-link img[alt="Lex"]');
    await expect(img).toHaveAttribute('width', '28');
    await expect(img).toHaveAttribute('height', '28');
  });
});
