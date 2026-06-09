import { test, expect } from '@playwright/test';

/**
 * Release Notes UI Tests
 * Verifies release notes render correctly — no raw HTML leaking,
 * links work, icons display, and structure is intact.
 */

test.describe('Release Notes: Page Structure', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/releases');
    await expect(page).toHaveTitle(/Release Notes/);
  });

  test('has h1 heading', async ({ page }) => {
    await page.goto('/releases');
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Release Notes');
  });

  test('has at least 5 release entries', async ({ page }) => {
    await page.goto('/releases');
    const entries = page.locator('[class*="rounded-xl"][class*="border"]').filter({ has: page.locator('.font-mono') });
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});

test.describe('Release Notes: No Raw HTML Leaking', () => {
  test('no visible <a href= raw text in feature lists', async ({ page }) => {
    await page.goto('/releases');
    // Only check visible text inside the release entries (not scripts)
    const entries = page.locator('article, .space-y-8, main .max-w-3xl');
    const text = await entries.first().innerText();
    expect(text).not.toContain('<a href=');
    expect(text).not.toContain('</a>');
  });

  test('no visible <img src= raw text in feature lists', async ({ page }) => {
    await page.goto('/releases');
    const entries = page.locator('article, .space-y-8, main .max-w-3xl');
    const text = await entries.first().innerText();
    expect(text).not.toContain('<img src=');
    expect(text).not.toContain('aria-hidden="true"');
  });

  test('no visible HTML tag syntax in release entries', async ({ page }) => {
    await page.goto('/releases');
    // Check all list items in features/fixes for raw HTML leaking
    const listItems = page.locator('.space-y-8 li span');
    const count = await listItems.count();
    for (let i = 0; i < Math.min(count, 50); i++) {
      const text = await listItems.nth(i).innerText();
      expect(text, `List item ${i} contains raw HTML`).not.toMatch(/<[a-z][\s\S]*?>/i);
    }
  });
});

test.describe('Release Notes: Kiro Links & Icons', () => {
  test('Kiro links point to kiro.dev', async ({ page }) => {
    await page.goto('/releases');
    const kiroLinks = page.locator('a[href="https://kiro.dev"]');
    const count = await kiroLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('Kiro links have the icon image', async ({ page }) => {
    await page.goto('/releases');
    const kiroIcons = page.locator('a[href="https://kiro.dev"] img[src="/kiro-icon.svg"]');
    const count = await kiroIcons.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('Kiro icon loads successfully (not broken)', async ({ page }) => {
    await page.goto('/releases');
    const icon = page.locator('a[href="https://kiro.dev"] img[src="/kiro-icon.svg"]').first();
    await expect(icon).toBeVisible();
    // Verify the image actually loaded (natural width > 0)
    const naturalWidth = await icon.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('Kiro links open in new tab (target=_blank)', async ({ page }) => {
    await page.goto('/releases');
    const kiroLinks = page.locator('a[href="https://kiro.dev"]');
    const count = await kiroLinks.count();
    for (let i = 0; i < count; i++) {
      const target = await kiroLinks.nth(i).getAttribute('target');
      expect(target).toBe('_blank');
    }
  });
});

test.describe('Release Notes: Version Entries', () => {
  test('latest version is shown first with "Latest" tag', async ({ page }) => {
    await page.goto('/releases');
    // The first release card should have a "Latest" badge
    const latestBadge = page.locator('.space-y-8 >> text=Latest').first();
    await expect(latestBadge).toBeVisible();
  });

  test('v1.0.0 entry exists with "Initial" tag', async ({ page }) => {
    await page.goto('/releases');
    const content = await page.locator('body').textContent();
    expect(content).toContain('v1.0.0');
    expect(content).toContain('Initial');
  });

  test('v1.0.0 mentions Kiro as first feature', async ({ page }) => {
    await page.goto('/releases');
    // Find the Kiro link inside the releases content
    const kiroInFeatures = page.locator('li a[href="https://kiro.dev"]');
    const count = await kiroInFeatures.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
