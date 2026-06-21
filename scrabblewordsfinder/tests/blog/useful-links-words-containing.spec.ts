import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — "Words Containing..." Section Tests
 * Tests the new "Letter Guides — Words Containing" collapsible section at /blog/useful-links/
 * Section ID: #letter-guides-containing
 * Contains 125 links to /blog/words-containing-XX/ posts grouped by letter series.
 */

const SECTION_ID = '#letter-guides-containing';

test.describe('Useful Links — Words Containing Section — Positive', () => {

  test('section exists and is visible on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator(SECTION_ID);
    await expect(section).toBeVisible();
  });

  test('section uses a collapsible details element', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    await expect(details).toBeAttached();
  });

  test('summary displays "Words Containing..." heading in teal', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator(`${SECTION_ID} summary .text-teal-400`);
    await expect(heading).toContainText('Words Containing');
  });

  test('summary shows post count badge', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const countBadge = page.locator(`${SECTION_ID} summary .text-xs.text-gray-500`);
    await expect(countBadge).toContainText('posts');
  });

  test('summary has teal-themed icon badge', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const iconBadge = page.locator(`${SECTION_ID} summary .bg-teal-900\\/30`);
    await expect(iconBadge).toBeVisible();
  });

  test('clicking summary expands the section', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    const summary = details.locator('summary');
    const content = details.locator('div.p-4.pt-0');
    // Should be collapsed by default
    const isOpen = await details.getAttribute('open');
    if (isOpen === null) {
      await summary.click();
    }
    await expect(content).toBeVisible();
  });

  test('contains link to Letter Guides landing page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const landingLink = details.locator('a[href="/blog/letter-guides/"]');
    await expect(landingLink).toBeVisible();
    await expect(landingLink).toContainText('View Letter Guides landing page');
  });

  test('contains links to words-containing blog posts', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const containingLinks = details.locator('a[href^="/blog/words-containing-"]');
    const count = await containingLinks.count();
    expect(count).toBeGreaterThanOrEqual(50);
  });

  test('links use grid layout with 3-4 columns', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const grid = details.locator('.grid.grid-cols-3').first();
    await expect(grid).toBeAttached();
  });

  test('has grouped letter-series sub-headings', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const subHeadings = details.locator('p.text-xs.text-gray-500.font-medium');
    const count = await subHeadings.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('A-series links are present (AA through AZ)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    await expect(details.locator('a[href="/blog/words-containing-aa/"]')).toBeAttached();
    await expect(details.locator('a[href="/blog/words-containing-az/"]')).toBeAttached();
  });
});

test.describe('Useful Links — Words Containing Section — Negative', () => {

  test('no page errors when expanding the section', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    await details.locator('summary').click();
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('no duplicate letter-guides-containing sections', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const sections = page.locator(SECTION_ID);
    await expect(sections).toHaveCount(1);
  });

  test('no links have empty href attributes', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const emptyLinks = details.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });

  test('all links are internal paths starting with /', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const links = await details.locator('a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.startsWith('/'), `Link "${href}" should start with /`).toBe(true);
    }
  });

  test('no duplicate links within the section', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`${SECTION_ID} details`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const links = await details.locator('a[href^="/blog/words-containing-"]').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate links found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('toggling open and closed does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    const summary = page.locator(`${SECTION_ID} details summary`);
    await summary.click();
    await page.waitForTimeout(200);
    await summary.click();
    await page.waitForTimeout(200);
    await summary.click();
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });

  test('section does not break existing sections on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    // Other known sections should still exist
    await expect(page.locator('#site-information')).toBeVisible();
    await expect(page.locator('#games-activities')).toBeVisible();
  });
});
