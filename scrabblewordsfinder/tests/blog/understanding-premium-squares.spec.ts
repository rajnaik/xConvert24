import { test, expect } from '@playwright/test';

const PAGE = '/blog/understanding-premium-squares/';

test.describe('Understanding Premium Squares — Inline Cross-Links — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('Dig Deeper cross-link section is visible', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    await expect(section).toBeVisible();
  });

  test('Dig Deeper heading uses correct uppercase styling', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('p.text-indigo-400.uppercase:has-text("Dig Deeper")');
    await expect(heading).toBeVisible();
  });

  test('cross-link to blocking-triple-word-squares is present', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    const link = section.locator('a[href="/blog/blocking-triple-word-squares/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Blocking Triple Word Squares');
  });

  test('cross-link to scrabble-scoring-guide is present', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    const link = section.locator('a[href="/blog/scrabble-scoring-guide/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Scoring Guide');
  });

  test('cross-link arrows use indigo-400 color class', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    const arrows = section.locator('span.text-indigo-400');
    await expect(arrows).toHaveCount(2);
  });

  test('cross-links have hover transition classes', async ({ page }) => {
    await page.goto(PAGE);
    const links = page.locator('.border-indigo-500\\/30 a.group');
    await expect(links).toHaveCount(2);
  });
});

test.describe('Understanding Premium Squares — Inline Cross-Links — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate Dig Deeper sections', async ({ page }) => {
    await page.goto(PAGE);
    const sections = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    await expect(sections).toHaveCount(1);
  });

  test('cross-links do not point to the current page (no self-link)', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    const selfLinks = section.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('cross-link hrefs are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    const links = section.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!.length).toBeGreaterThan(1);
    }
  });

  test('cross-link text labels are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    const descriptions = section.locator('span.text-gray-300');
    const count = await descriptions.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      const text = await descriptions.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
