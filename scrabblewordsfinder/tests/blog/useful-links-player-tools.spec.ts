import { test, expect } from '@playwright/test';

/**
 * Useful Links — Player Tools & Data Section
 * Tests the #player-tools section on /blog/useful-links/.
 * 
 * Change: Player Statistics link (/stats/) was disabled (commented out).
 * Remaining links: Achievements, Profile Data, WordBench Practice, Workbench Data.
 */

test.describe('Useful Links — Player Tools — Positive', () => {

  test('player tools section exists and is visible', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#player-tools');
    await expect(section).toBeVisible();
  });

  test('player tools section has correct heading', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator('#player-tools h2');
    await expect(heading).toContainText('Player Tools & Data');
  });

  test('achievements link is visible and correct', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#player-tools');
    const link = section.locator('a[href="/achievements/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Achievements');
  });

  test('profile data link is visible and correct', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#player-tools');
    const link = section.locator('a[href="/profile-data/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Profile Data');
  });
});

test.describe('Useful Links — Player Tools — Negative', () => {

  test('player statistics link is NOT visible (disabled feature)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#player-tools');
    const statsLink = section.locator('a[href="/stats/"]');
    await expect(statsLink).toHaveCount(0);
  });

  test('no page errors when loading player tools section', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('player tools section has no empty href links', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#player-tools');
    const emptyLinks = section.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });

  test('no duplicate links in player tools section', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#player-tools');
    const links = await section.locator('a').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates).toHaveLength(0);
  });
});
