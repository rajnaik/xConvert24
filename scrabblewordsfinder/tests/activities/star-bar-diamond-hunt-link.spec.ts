import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// The StarBar now has a Diamond Hunt icon link (with .no-underline class)
// placed among the daily activity stars (WOTD, Quiz, MWB, etc.)
const HUNT_LINK_SELECTOR = '#star-bar a.no-underline[href="/diamond-hunt/"]';

// ── StarBar Diamond Hunt Link — Positive ──────────────────────────────────

test.describe('StarBar Diamond Hunt Link — Positive', () => {
  test('Diamond Hunt icon link is visible in the star bar', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLink = page.locator(HUNT_LINK_SELECTOR);
    await expect(huntLink).toBeVisible();
  });

  test('Diamond Hunt icon link points to /diamond-hunt/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLink = page.locator(HUNT_LINK_SELECTOR);
    await expect(huntLink).toHaveAttribute('href', '/diamond-hunt/');
  });

  test('Diamond Hunt icon link has correct title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLink = page.locator(HUNT_LINK_SELECTOR);
    await expect(huntLink).toHaveAttribute('title', /Diamond Hunt/);
  });

  test('Diamond Hunt icon link contains diamond emoji', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLink = page.locator(HUNT_LINK_SELECTOR);
    await expect(huntLink).toContainText('\u{1F48E}');
  });

  test('Diamond Hunt label shows "Hunt" text in purple', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLink = page.locator(HUNT_LINK_SELECTOR);
    const label = huntLink.locator('span.text-purple-400');
    await expect(label).toHaveText('Hunt');
  });

  test('Diamond Hunt badge shows count "121"', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLink = page.locator(HUNT_LINK_SELECTOR);
    const badge = huntLink.locator('span.absolute');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('121');
  });
});

// ── StarBar Diamond Hunt Link — Negative ──────────────────────────────────

test.describe('StarBar Diamond Hunt Link — Negative', () => {
  test('exactly one Diamond Hunt icon link exists in the star bar stars row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator(HUNT_LINK_SELECTOR).count();
    expect(count).toBe(1);
  });

  test('Diamond Hunt icon link href is valid (not empty or hash)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const href = await page.locator(HUNT_LINK_SELECTOR).getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('#');
    expect(href).not.toBe('');
  });

  test('no JavaScript errors when star bar renders with Diamond Hunt icon', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector(HUNT_LINK_SELECTOR);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('Diamond Hunt icon link is an internal path (not external URL)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const href = await page.locator(HUNT_LINK_SELECTOR).getAttribute('href');
    expect(href).toMatch(/^\//);
  });
});
