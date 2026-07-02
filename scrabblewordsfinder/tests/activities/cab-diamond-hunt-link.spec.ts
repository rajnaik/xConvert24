import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB — Diamond Hunt Link in Lex Modal Header
 * A purple diamond icon link was added next to the Lex close button
 * in the AI Coach modal header. It links to /diamond-hunt/.
 */

test.describe('CaB Diamond Hunt Link — Positive', () => {
  test('diamond hunt link is visible in the Lex modal header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Open Lex modal
    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    // Diamond Hunt link should be in the header
    const diamondLink = lexModal.locator('a[href="/diamond-hunt/"]');
    await expect(diamondLink).toBeVisible();
  });

  test('diamond hunt link has correct href with trailing slash', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    const diamondLink = lexModal.locator('a[href="/diamond-hunt/"]');
    await expect(diamondLink).toHaveAttribute('href', '/diamond-hunt/');
  });

  test('diamond hunt link has descriptive title for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    const diamondLink = lexModal.locator('a[href="/diamond-hunt/"]');
    const title = await diamondLink.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title!.toLowerCase()).toContain('diamond');
  });

  test('diamond hunt link contains diamond emoji', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    const diamondLink = lexModal.locator('a[href="/diamond-hunt/"]');
    const text = await diamondLink.textContent();
    expect(text).toContain('💎');
  });
});

test.describe('CaB Diamond Hunt Link — Negative', () => {
  test('no duplicate diamond hunt links in the Lex modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    const diamondLinks = lexModal.locator('a[href="/diamond-hunt/"]');
    await expect(diamondLinks).toHaveCount(1);
  });

  test('diamond hunt link does not break the close button functionality', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    // Close button should still work
    const closeBtn = page.locator('#cab-lex-close');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(lexModal).not.toBeVisible();
  });

  test('diamond hunt link does not cause JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);

    const lexOpen = page.locator('#LexCandB');
    await lexOpen.click();

    const lexModal = page.locator('#cab-lex-modal');
    await expect(lexModal).toBeVisible();

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
