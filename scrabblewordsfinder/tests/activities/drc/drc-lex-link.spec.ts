import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Scoped locator: the Lex link inside the Daily Rack Challenge panel
const DRC_LEX_SELECTOR = 'a[href="/chat/?context=rack"][title="Get AI coaching on your rack challenge"]';

// ── Daily Rack Lex Link — Positive ───────────────────────────────────────

test.describe('Daily Rack Challenge Lex Link — Positive', () => {
  test('Lex link is visible in the Daily Rack Challenge panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(DRC_LEX_SELECTOR);
    await expect(lexLink).toBeVisible();
  });

  test('Lex link has correct href to /chat/?context=rack', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(DRC_LEX_SELECTOR);
    await expect(lexLink).toHaveAttribute('href', '/chat/?context=rack');
  });

  test('Lex link has avatar image and Lex text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(DRC_LEX_SELECTOR);
    // Avatar image should exist with correct src and alt
    const avatar = lexLink.locator('img[src="/lex-avatar-32.png"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('alt', 'Lex');
    await expect(avatar).toHaveAttribute('width', '16');
    await expect(avatar).toHaveAttribute('height', '16');
    // Text label should say "Lex"
    const content = await lexLink.textContent();
    expect(content).toContain('Lex');
  });

  test('Lex link has descriptive title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(DRC_LEX_SELECTOR);
    await expect(lexLink).toHaveAttribute('title', 'Get AI coaching on your rack challenge');
  });
});

// ── Daily Rack Lex Link — Negative ───────────────────────────────────────

test.describe('Daily Rack Challenge Lex Link — Negative', () => {
  test('only one DRC Lex link on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLinks = page.locator(DRC_LEX_SELECTOR);
    await expect(lexLinks).toHaveCount(1);
  });

  test('Lex link does not break the drc-history-btn placement', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // History button should still exist in the DOM (initially hidden)
    const historyBtn = page.locator('#drc-history-btn');
    await expect(historyBtn).toHaveCount(1);
  });

  test('no JS errors on activities page after DRC Lex link added', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror')
    )).toHaveLength(0);
  });
});
