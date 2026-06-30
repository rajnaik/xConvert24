import { test, expect } from '@playwright/test';

test.describe('Search Bar — Positive', () => {

  test('desktop search input has placeholder and no hardcoded value', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await expect(input).toHaveAttribute('placeholder', 'Search pages, blog...');
    await expect(input).toHaveValue('');
  });

  test('desktop search clears placeholder on focus and accepts typing', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.click();
    await input.fill('strategy');
    await expect(input).toHaveValue('strategy');
  });

  test('desktop search shows results dropdown when typing 2+ chars', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.click();
    await input.fill('gu');
    await page.waitForTimeout(300);
    const dropdown = input.locator('..').locator('div.absolute');
    await expect(dropdown).toBeVisible();
  });

  test('desktop search finds site pages (e.g. "guide")', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const result = input.locator('..').locator('a[href="/guide/"]');
    await expect(result).toBeVisible();
  });

  test('desktop search finds blog category pages (e.g. "strategy")', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('strategy');
    await page.waitForTimeout(300);
    const result = input.locator('..').locator('a[href="/blog/strategy/"]');
    await expect(result).toBeVisible();
  });

  test('search works on blog pages too', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const input = page.locator('#dict-search');
    await expect(input).toHaveAttribute('placeholder', 'Search pages, blog...');
    await input.fill('solver');
    await page.waitForTimeout(300);
    const result = input.locator('..').locator('a[href="/"]');
    // Homepage already has trailing slash
    await expect(result).toBeVisible();
  });

  test('pressing Enter navigates to /chat/?q=query', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('endgame');
    await input.press('Enter');
    // Chat page reads ?q= then cleans URL via replaceState, so final URL is /chat/
    await page.waitForURL(/\/chat\//);
    expect(page.url()).toContain('/chat/');
  });
});

test.describe('Search Bar — Negative', () => {

  test('no dropdown appears with only 1 character typed', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('a');
    await page.waitForTimeout(300);
    const dropdown = input.locator('..').locator('div.absolute');
    const isVisible = await dropdown.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('dropdown closes on Escape key', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const dropdown = input.locator('..').locator('div.absolute');
    await expect(dropdown).toBeVisible();
    await input.press('Escape');
    await expect(dropdown).toBeHidden();
  });

  test('dropdown closes when clicking outside', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const dropdown = input.locator('..').locator('div.absolute');
    await expect(dropdown).toBeVisible();
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(dropdown).toBeHidden();
  });

  test('no hardcoded "Words starting with Q" text exists anywhere', async ({ page }) => {
    await page.goto('/');
    const content = await page.content();
    expect(content).not.toContain('value="Words starting with Q"');
  });

  test('shows helpful no-results message for unknown queries', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#dict-search');
    await input.fill('xyznonexistent');
    await page.waitForTimeout(300);
    const noResults = input.locator('..').locator('div.absolute');
    await expect(noResults).toContainText('No results');
  });
});
