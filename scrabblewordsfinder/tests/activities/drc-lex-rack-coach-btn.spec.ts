import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * DRC — Lex Rack Coach Button
 * The "Lex Rack Coach" element in the Daily Rack Challenge panel header
 * was changed from an anchor link (<a href="/chat/?context=rack">) to a
 * <button> that triggers inline behaviour rather than navigating away.
 */

test.describe('DRC Lex Rack Coach Button — Positive', () => {
  test('Lex Rack Coach button is visible in the DRC panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexRack');
    await expect(lexBtn).toBeVisible();
  });

  test('Lex Rack Coach is a button element with type=button', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexRack');
    await expect(lexBtn).toHaveAttribute('type', 'button');
  });

  test('Lex Rack Coach button contains the Lex avatar image', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexImg = page.locator('#LexRack img[alt="Lex"]');
    await expect(lexImg).toBeVisible();
  });

  test('Lex Rack Coach button has descriptive title for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexRack');
    await expect(lexBtn).toHaveAttribute('title', 'Get AI coaching on your rack challenge');
  });
});

test.describe('DRC Lex Rack Coach Button — Negative', () => {
  test('no duplicate Lex Rack Coach buttons exist in the DRC panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtns = page.locator('#LexRack');
    await expect(lexBtns).toHaveCount(1);
  });

  test('Lex Rack Coach button does not cause JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexRack').waitFor({ state: 'visible' });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('Lex Rack Coach button is not an anchor — no href attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexRack');
    const href = await lexBtn.getAttribute('href');
    expect(href).toBeNull();
  });

  test('Lex Rack Coach avatar image has non-empty alt text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexImg = page.locator('#LexRack img');
    const alt = await lexImg.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt!.trim().length).toBeGreaterThan(0);
  });
});
