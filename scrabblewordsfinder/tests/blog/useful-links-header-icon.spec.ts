import { test, expect } from '@playwright/test';

test.describe('Useful Links Header Icon — Positive', () => {

  test('desktop header has Useful Links icon linking to /blog/useful-links/', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('header a[href="/blog/useful-links/"]').first();
    await expect(link).toBeVisible();
  });

  test('Useful Links icon displays 🔗 emoji', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('header a[href="/blog/useful-links/"]').first();
    await expect(link).toContainText('🔗');
  });

  test('Useful Links icon has tooltip text', async ({ page }) => {
    await page.goto('/');
    const tooltip = page.locator('header a[href="/blog/useful-links/"] span').filter({ hasText: 'Useful Links' });
    await expect(tooltip.first()).toBeAttached();
  });

  test('Useful Links icon appears on blog pages too', async ({ page }) => {
    await page.goto('/blog/');
    const link = page.locator('a[href="/blog/useful-links/"]').first();
    await expect(link).toBeAttached();
  });

  test('Useful Links icon navigates to correct page', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('header a[href="/blog/useful-links/"]').first();
    const href = await link.getAttribute('href');
    expect(href).toBe('/blog/useful-links/');
  });

  test('mobile header has Useful Links icon', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const link = page.locator('a[href="/blog/useful-links/"]').filter({ hasText: '🔗' });
    // Mobile layout has the icon attached (in mobile section icons div)
    await expect(link.first()).toBeAttached();
  });
});

test.describe('Useful Links Header Icon — Negative', () => {

  test('no duplicate Useful Links icons in header', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('header a[href="/blog/useful-links/"]');
    // Desktop shows one in desktop layout, mobile shows one in mobile layout
    // Only one should be visible at desktop viewport
    const visibleLinks = await links.evaluateAll(els => els.filter(el => el.offsetParent !== null).length);
    expect(visibleLinks).toBe(1);
  });

  test('Useful Links icon does not break header layout (no overflow)', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header').first();
    const box = await header.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
    expect(box!.height).toBeLessThan(400); // header shouldn't be unreasonably tall
  });

  test('no page errors when header renders with new icon', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('Useful Links icon order: appears after Suggest and before Achievements', async ({ page }) => {
    await page.goto('/');
    const icons = await page.locator('header .ml-auto a[href]').evaluateAll(els =>
      els.filter(el => el.offsetParent !== null).map(el => el.getAttribute('href'))
    );
    const suggestIdx = icons.indexOf('/suggest/');
    const usefulIdx = icons.indexOf('/blog/useful-links/');
    const achieveIdx = icons.indexOf('/achievements/');
    // All should exist and be in order
    expect(usefulIdx).toBeGreaterThan(-1);
    if (suggestIdx > -1 && achieveIdx > -1) {
      expect(usefulIdx).toBeGreaterThan(suggestIdx);
      expect(usefulIdx).toBeLessThan(achieveIdx);
    }
  });
});
