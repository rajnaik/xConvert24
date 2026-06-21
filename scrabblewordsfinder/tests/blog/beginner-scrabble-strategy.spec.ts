import { test, expect } from '@playwright/test';

const PAGE = '/blog/beginner-scrabble-strategy/';

test.describe('Beginner Scrabble Strategy — Related Articles — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('related articles section is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
  });

  test('guide link is present in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const guideLink = aside.locator('a[href="/guide/"]');
    await expect(guideLink).toBeVisible();
    await expect(guideLink).toContainText('Complete Tool Guide');
  });

  test('achievements link is present in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const achievementsLink = aside.locator('a[href="/achievements/"]');
    await expect(achievementsLink).toBeVisible();
    await expect(achievementsLink).toContainText('Achievements');
  });

  test('related articles contains at least 6 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('opening moves guide link is present', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside.locator('a[href="/blog/opening-moves-guide/"]')).toBeVisible();
  });
});

test.describe('Beginner Scrabble Strategy — Related Articles — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate guide links in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const guideLinks = aside.locator('a[href="/guide/"]');
    await expect(guideLinks).toHaveCount(1);
  });

  test('no duplicate achievements links in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const achievementsLinks = aside.locator('a[href="/achievements/"]');
    await expect(achievementsLinks).toHaveCount(1);
  });

  test('related articles links do not have empty href', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no duplicate related articles sections on page', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });
});
