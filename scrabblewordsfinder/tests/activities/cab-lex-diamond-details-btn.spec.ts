import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB — Diamond Hunt Details Button
 * A new "💎 Diamond Hunt - Details" button was added next to the
 * "🧠 Coach me on my games" button in the Lex AI modal footer.
 * Both buttons now live inside a flex wrapper for proper alignment.
 */

test.describe('CaB Diamond Hunt Details Button — Positive', () => {
  test('Diamond Hunt Details button is visible after opening Lex modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Open Lex modal
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const diamondBtn = page.locator('#cab-lex-diamond-btn');
    await expect(diamondBtn).toBeVisible();
  });

  test('Diamond Hunt Details button has correct text content', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const diamondBtn = page.locator('#cab-lex-diamond-btn');
    const text = await diamondBtn.textContent();
    expect(text).toContain('💎');
    expect(text).toContain('Diamond Hunt');
  });

  test('Diamond Hunt Details button is a button element with type=button', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const diamondBtn = page.locator('#cab-lex-diamond-btn');
    const tagName = await diamondBtn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('button');
    await expect(diamondBtn).toHaveAttribute('type', 'button');
  });

  test('Diamond Hunt Details button and Coach button share the same flex container', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const coachBtn = page.locator('#cab-lex-coach-btn');
    const diamondBtn = page.locator('#cab-lex-diamond-btn');

    await expect(coachBtn).toBeVisible();
    await expect(diamondBtn).toBeVisible();

    // They share the same parent div with flex layout
    const parentClass = await diamondBtn.evaluate(el => el.parentElement?.className || '');
    expect(parentClass).toContain('flex');
    expect(parentClass).toContain('gap-2');
  });
});

test.describe('CaB Diamond Hunt Details Button — Negative', () => {
  test('no duplicate Diamond Hunt Details buttons exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    const diamondBtns = page.locator('#cab-lex-diamond-btn');
    await expect(diamondBtns).toHaveCount(1);
  });

  test('Diamond Hunt Details button does not cause JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });
    await page.locator('#cab-lex-diamond-btn').waitFor({ state: 'visible' });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
