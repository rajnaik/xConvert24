import { test, expect } from '@playwright/test';

/**
 * Admin Useful Links in Blogs — Dashboard Card & Page Tests
 * Tests:
 * - Dashboard card presence and correct content
 * - /admin/useful-links/ page structure
 * - Category panels, collapsible details, link grid
 * - Negative: no crash, no empty state, no duplicate card
 */

test.describe('Useful Links — Dashboard Card (Positive)', () => {
  test('card exists on admin dashboard linking to /admin/useful-links/', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/useful-links/"]');
    await expect(card).toBeVisible();
  });

  test('card has correct heading text', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/useful-links/"]');
    await expect(card.locator('h2')).toContainText('Useful Links in Blogs');
  });

  test('card has description mentioning orphan pages', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/useful-links/"]');
    await expect(card).toContainText('Orphan blog pages');
  });

  test('card lists key stats (pages needing links, categories)', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/useful-links/"]');
    await expect(card).toContainText('pages needing internal links');
    await expect(card).toContainText('categories');
  });
});

test.describe('Useful Links — Dashboard Card (Negative)', () => {
  test('card appears exactly once (no duplicates)', async ({ page }) => {
    await page.goto('/admin/');
    const cards = page.locator('a[href="/admin/useful-links/"]');
    await expect(cards).toHaveCount(1);
  });

  test('card does not have broken or empty heading', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/useful-links/"]');
    const heading = await card.locator('h2').textContent();
    expect(heading?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Useful Links — Page Structure (Positive)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    await expect(page).toHaveTitle(/Useful Links/);
  });

  test('has page heading with link emoji', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    await expect(page.locator('h1').first()).toContainText('Useful Links in Blogs');
  });

  test('shows orphan count badge', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const badge = page.locator('text=/\\d+ orphan pages/');
    await expect(badge).toBeVisible();
  });

  test('has navigation bar with Admin and Site links', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const nav = page.locator('nav').first();
    await expect(nav.locator('a[href="/admin/"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]').first()).toBeAttached();
  });

  test('current nav link is highlighted for Useful Links', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const activeLink = page.locator('nav a[href="/admin/useful-links/"]');
    await expect(activeLink).toHaveClass(/text-amber-400/);
  });

  test('displays category panels as collapsible details elements', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const panels = page.locator('details');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('each category panel has a name and count badge', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const firstPanel = page.locator('details').first();
    await expect(firstPanel.locator('h2')).toBeVisible();
    await expect(firstPanel.locator('span.text-xs')).toBeVisible();
  });

  test('links inside panels point to /blog/ paths', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    // Open a panel that's collapsed by default
    const firstDetails = page.locator('details').first();
    if (!(await firstDetails.getAttribute('open'))) {
      await firstDetails.locator('summary').click();
    }
    const blogLinks = firstDetails.locator('a[href^="/blog/"]');
    const count = await blogLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('blog links open in new tab (target=_blank)', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const firstDetails = page.locator('details').first();
    if (!(await firstDetails.getAttribute('open'))) {
      await firstDetails.locator('summary').click();
    }
    const firstLink = firstDetails.locator('a[href^="/blog/"]').first();
    await expect(firstLink).toHaveAttribute('target', '_blank');
  });

  test('summary strip shows category counts', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const summaryCards = page.locator('.grid.grid-cols-2 > div');
    const count = await summaryCards.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('footer info section with fix instructions exists', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    await expect(page.locator('text=How to fix')).toBeVisible();
  });
});

test.describe('Useful Links — Page (Negative)', () => {
  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/useful-links/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('page has noindex meta tag (not indexed by search engines)', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  test('collapsing and expanding a panel does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/useful-links/');
    const details = page.locator('details').first();
    const summary = details.locator('summary');
    // Toggle closed then open
    await summary.click();
    await page.waitForTimeout(200);
    await summary.click();
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });

  test('no orphan links pointing to empty hrefs', async ({ page }) => {
    await page.goto('/admin/useful-links/');
    const emptyLinks = page.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });
});
