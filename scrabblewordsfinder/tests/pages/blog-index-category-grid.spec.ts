import { test, expect } from '@playwright/test';

/**
 * Blog Index — Category Navigation Grid & Useful Links Panel
 *
 * Tests the redesigned category navigation (grouped grid tiles with section headings)
 * and the new collapsible Useful Links panel.
 *
 * File changed: src/pages/blog/index.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Blog Index — Category Grid — Positive', () => {
  test('category grid container uses grid layout', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const grid = page.locator('.grid.grid-cols-3').first();
    await expect(grid).toBeVisible();
  });

  test('section headings are visible for each group', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const headings = ['Learn & Strategy', 'Word Lists', 'Word Validity & Themes', 'Word Patterns', 'Resources', 'Activities'];
    for (const heading of headings) {
      const el = page.locator('.grid.grid-cols-3 p', { hasText: heading }).first();
      await expect(el).toBeVisible();
    }
  });

  test('category tiles link to correct destinations with trailing slashes', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const expectedLinks = [
      '/blog/beginner-guides/',
      '/blog/strategy/',
      '/blog/tournament/',
      '/blog/two-letter-words/',
      '/blog/three-letter-words/',
      '/blog/bingos/',
      '/blog/high-scoring/',
      '/blog/letter-guides/',
      '/blog/dictionaries/',
    ];
    for (const href of expectedLinks) {
      const link = page.locator(`.grid.grid-cols-3 a[href="${href}"]`);
      await expect(link).toBeVisible();
    }
  });

  test('each tile has an icon and label', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    // Check the Beginner tile specifically
    const beginnerTile = page.locator('a[href="/blog/beginner-guides/"]');
    await expect(beginnerTile).toBeVisible();
    await expect(beginnerTile.locator('span').first()).toContainText('📘');
    await expect(beginnerTile.locator('span').last()).toContainText('Beginner');
  });
});

test.describe('Blog Index — Useful Links Panel — Positive', () => {
  test('useful links panel is visible', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const panel = page.locator('#useful-links-panel');
    await expect(panel).toBeVisible();
  });

  test('useful links toggle button is visible with correct text', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const toggle = page.locator('#useful-links-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Useful Links');
  });

  test('useful links content is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const content = page.locator('#useful-links-content');
    await expect(content).toBeHidden();
  });

  test('useful links content toggles open on click', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const toggle = page.locator('#useful-links-toggle');
    const content = page.locator('#useful-links-content');
    await toggle.click();
    await expect(content).toBeVisible();
  });

  test('useful links contains four category sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    await page.locator('#useful-links-toggle').click();
    const sections = page.locator('#useful-links-content .rounded-lg');
    await expect(sections).toHaveCount(4);
  });

  test('useful links sections have correct labels', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    await page.locator('#useful-links-toggle').click();
    const labels = ['Games & Activities', 'Player Tools & Data', 'Site Information', 'Legal & Privacy'];
    for (const label of labels) {
      const el = page.locator('#useful-links-content p', { hasText: label });
      await expect(el).toBeVisible();
    }
  });

  test('useful links footer links to full useful links page', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    await page.locator('#useful-links-toggle').click();
    const footerLink = page.locator('#useful-links-content a[href="/blog/useful-links/"]');
    await expect(footerLink).toBeVisible();
    await expect(footerLink).toContainText('View full Useful Links page');
  });
});

test.describe('Blog Index — Category Grid — Negative', () => {
  test('no duplicate category tiles for same href in grid', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const grid = page.locator('.grid.grid-cols-3').first();
    const links = grid.locator('a');
    const count = await links.count();
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href && !href.startsWith('/activities/')) {
        // Activities tiles intentionally share href
        hrefs.push(href);
      }
    }
    const uniqueHrefs = [...new Set(hrefs)];
    expect(hrefs.length).toBe(uniqueHrefs.length);
  });

  test('old flat pill-style nav is removed (no flex-wrap category container)', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    // The old nav used "flex flex-wrap gap-2 mb-6" — should not exist anymore
    const oldNav = page.locator('.flex.flex-wrap.gap-2.mb-6');
    await expect(oldNav).toHaveCount(0);
  });
});

test.describe('Blog Index — Useful Links Panel — Negative', () => {
  test('no duplicate useful links panels', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const panels = page.locator('#useful-links-panel');
    await expect(panels).toHaveCount(1);
  });

  test('useful links internal links all have trailing slashes', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    await page.locator('#useful-links-toggle').click();
    const links = page.locator('#useful-links-content a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href, `Link at index ${i} should end with /`).toMatch(/\/$/);
    }
  });
});
