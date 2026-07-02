import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB Lex Modal — Diamond Hunt Link
 * A 💎 icon link was added to the Lex modal header to direct users
 * to the Diamond Hunt page (/diamond-hunt/).
 */

test.describe('CaB Lex Modal Diamond Hunt Link — Positive', () => {
  test('Diamond Hunt link is visible in the Lex modal header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Open the Lex modal
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    // Check Diamond Hunt link exists in modal header
    const dhLink = page.locator('#cab-lex-modal a[href="/diamond-hunt/"]');
    await expect(dhLink).toBeVisible();
  });

  test('Diamond Hunt link has correct href with trailing slash', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const dhLink = page.locator('#cab-lex-modal a[href="/diamond-hunt/"]');
    await expect(dhLink).toHaveAttribute('href', '/diamond-hunt/');
  });

  test('Diamond Hunt link has descriptive title for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const dhLink = page.locator('#cab-lex-modal a[href="/diamond-hunt/"]');
    const title = await dhLink.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title!.toLowerCase()).toContain('diamond');
  });

  test('Diamond Hunt link contains diamond emoji', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const dhLink = page.locator('#cab-lex-modal a[href="/diamond-hunt/"]');
    const text = await dhLink.textContent();
    expect(text).toContain('💎');
  });
});

test.describe('CaB Lex Modal Diamond Hunt Link — Negative', () => {
  test('no duplicate Diamond Hunt links in the Lex modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const dhLinks = page.locator('#cab-lex-modal a[href="/diamond-hunt/"]');
    await expect(dhLinks).toHaveCount(1);
  });

  test('Diamond Hunt link does not cause JavaScript errors when modal opens', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
