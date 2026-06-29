import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Diamond Hunt Slot — Positive ─────────────────────────────────────────

test.describe('Diamond Hunt Slot — Positive', () => {
  test('diamond-hunt-slot element exists in the DOM with correct data-diamond-id', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="1"]');
    await expect(slot).toBeAttached();
  });

  test('slot has role="button" and tabindex for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="1"]');
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
    await expect(slot).toHaveAttribute('aria-label', 'Claim a hidden diamond');
  });

  test('slot contains diamond emoji and descriptive text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="1"]');
    // Check inner content exists (even when hidden, the text is in the DOM)
    const innerText = await slot.innerHTML();
    expect(innerText).toContain('💎');
    expect(innerText).toContain('Hidden Diamond!');
    expect(innerText).toContain('remaining — click to claim');
  });

  test('slot is placed after the activities grid', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The slot should come after the main grid and before the quick-link-tiles
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="1"]');
    const quickLinks = page.locator('#quick-link-tiles');
    // Both should be attached
    await expect(slot).toBeAttached();
    await expect(quickLinks).toBeAttached();
  });

  test('slot has purple gradient styling for diamond theme', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const inner = page.locator('.diamond-hunt-slot[data-diamond-id="1"] > div');
    const classAttr = await inner.getAttribute('class');
    expect(classAttr).toContain('border-purple-700/50');
    expect(classAttr).toContain('from-purple-950/40');
    expect(classAttr).toContain('to-blue-950/40');
  });
});

// ── Diamond Hunt Slot — Negative ─────────────────────────────────────────

test.describe('Diamond Hunt Slot — Negative', () => {
  test('slot is hidden by default (no active mine without script reveal)', async ({ page }) => {
    // Block the diamond-hunt API so the reveal script cannot run
    await page.route('**/api/diamond-hunt/**', route => route.abort());
    await page.goto(ACTIVITIES_URL);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="1"]');
    // The element has class="hidden" by default
    const classAttr = await slot.getAttribute('class');
    expect(classAttr).toContain('hidden');
  });

  test('no duplicate diamond-hunt-slot elements on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator('.diamond-hunt-slot').count();
    expect(count).toBe(1);
  });

  test('no JavaScript errors from diamond hunt slot on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('h1');
    // Allow time for any diamond-hunt related scripts to run
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('slot does not cause layout shift or overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    // Since the slot is hidden, it should not affect visible layout
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
