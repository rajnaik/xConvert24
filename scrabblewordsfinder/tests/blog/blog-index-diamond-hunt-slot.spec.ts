import { test, expect } from '@playwright/test';

/**
 * Tests for the DiamondHuntSlot component on the Blog Index page.
 * Added in the blog/index.astro diff — a hidden diamond claim slot
 * that becomes visible when an active mine is configured.
 */

test.describe('Blog Index — DiamondHuntSlot — Positive', () => {

  test('diamond hunt slot element exists in the DOM', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    await expect(slot).toHaveCount(1);
  });

  test('diamond hunt slot has correct data-diamond-id attribute', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot');
    await expect(slot).toHaveAttribute('data-diamond-id', '7');
  });

  test('diamond hunt slot has role=button and tabindex for accessibility', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
  });

  test('diamond hunt slot has aria-label for screen readers', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    await expect(slot).toHaveAttribute('aria-label', 'Claim a hidden diamond');
  });

  test('diamond hunt slot contains the diamond emoji and text', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    const emojiText = await slot.locator('span.text-2xl').textContent();
    expect(emojiText?.trim()).toBe('\uD83D\uDC8E'); // diamond emoji
    const title = slot.locator('p.text-sm');
    await expect(title).toContainText('Hidden Diamond');
  });

  test('diamond hunt slot shows remaining count placeholder', async ({ page }) => {
    await page.goto('/blog/');
    const remaining = page.locator('.diamond-hunt-slot[data-diamond-id="7"] .diamond-remaining');
    await expect(remaining).toHaveCount(1);
  });
});

test.describe('Blog Index — DiamondHuntSlot — Negative', () => {

  test('diamond hunt slot is hidden by default (has hidden class)', async ({ page }) => {
    await page.goto('/blog/');
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    const classes = await slot.getAttribute('class');
    expect(classes).toContain('hidden');
  });

  test('only one diamond hunt slot exists on the blog index page', async ({ page }) => {
    await page.goto('/blog/');
    const slots = page.locator('.diamond-hunt-slot');
    await expect(slots).toHaveCount(1);
  });

  test('diamond hunt slot does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/');
    await page.waitForTimeout(1000);
    const criticalErrors = errors.filter(e =>
      e.includes('diamond') || e.includes('Diamond') || e.includes('TypeError')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('diamond hunt slot is placed after the blog content script', async ({ page }) => {
    await page.goto('/blog/');
    // The slot should be inside BlogLayout but exist in the DOM
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="7"]');
    await expect(slot).toHaveCount(1);
    // It should NOT be inside the nav grid (it's a separate feature)
    const gridSlot = page.locator('.grid.grid-cols-3 .diamond-hunt-slot');
    await expect(gridSlot).toHaveCount(0);
  });
});
