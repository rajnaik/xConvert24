import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Site Search (Desktop) — Positive ────────────────────────────────────────

test.describe('Site Search Desktop — Positive', () => {
  test('desktop search input exists and is visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', /Search/);
  });

  test('typing a query shows a results dropdown with matching pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('strategy');
    // Wait for debounced results (150ms + render)
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const links = resultsBox.locator('a');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('results include matches from page titles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('Settings');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a', { hasText: 'Settings' })).toHaveCount(1);
  });

  test('results include matches from descriptions', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('UUID');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    // Settings description includes "UUID"
    await expect(resultsBox.locator('a')).not.toHaveCount(0);
  });

  test('results include matches from URLs', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('wordbench');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href*="wordbench"]')).not.toHaveCount(0);
  });

  test('clicking a result navigates to the correct page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('About');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    const aboutLink = resultsBox.locator('a[href="/about/"]');
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL(/\/about/);
  });

  test('pressing Enter navigates to /blog?q=<query>', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('tactics');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/blog\?q=tactics/);
  });

  test('Find button navigates to /blog?q=<query> when input has text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('premium');
    const findBtn = page.locator('#search-find-btn');
    await findBtn.click();
    await expect(page).toHaveURL(/\/blog\?q=premium/);
  });

  test('Escape key closes the results dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await input.press('Escape');
    await expect(resultsBox).toBeHidden();
  });

  test('results are limited to 12 items maximum', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    // "words" should match many entries
    await input.fill('words');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    const links = resultsBox.locator('a');
    expect(await links.count()).toBeLessThanOrEqual(12);
  });
});

// ── Site Search (Desktop) — Negative ────────────────────────────────────────

test.describe('Site Search Desktop — Negative', () => {
  test('no dropdown shown with fewer than 2 characters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('a');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    // Should be hidden or not exist
    if (await resultsBox.count() > 0) {
      await expect(resultsBox).toBeHidden();
    }
  });

  test('no results message shown for nonsense query', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('xyzzyqwerty');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox).toContainText('No results');
  });

  test('dropdown closes when clicking outside', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('blog');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    // Click somewhere else on the page
    await page.locator('body').click({ position: { x: 50, y: 50 } });
    await expect(resultsBox).toBeHidden();
  });

  test('Find button navigates to /blog/ without query param when input has fewer than 2 chars', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('x');
    const findBtn = page.locator('#search-find-btn');
    await findBtn.click();
    // Navigates to /blog/ but without the ?q= param since input is too short
    await expect(page).toHaveURL(/\/blog\/?$/);
  });

  test('Enter does not navigate when input has fewer than 2 chars', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('z');
    await input.press('Enter');
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('no duplicate search inputs on desktop view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const desktopInputs = page.locator('#dict-search');
    await expect(desktopInputs).toHaveCount(1);
  });
});

// ── Site Search (Mobile) — Positive ─────────────────────────────────────────

test.describe('Site Search Mobile — Positive', () => {
  test('mobile search input exists and is visible on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await expect(input).toBeVisible();
  });

  test('mobile search shows results on typing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.fill('privacy');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a', { hasText: 'Privacy' })).not.toHaveCount(0);
  });

  test('mobile Find button navigates to /blog?q=<query>', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.fill('scrabble');
    const findBtn = page.locator('#search-find-btn-mobile');
    await findBtn.click();
    await expect(page).toHaveURL(/\/blog\?q=scrabble/);
  });

  test('mobile Enter key navigates to /blog?q=<query>', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.fill('rules');
    await input.press('Enter');
    await expect(page).toHaveURL(/\/blog\?q=rules/);
  });
});

// ── Site Search (Mobile) — Negative ─────────────────────────────────────────

test.describe('Site Search Mobile — Negative', () => {
  test('mobile search does not show dropdown for single char', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.fill('b');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    if (await resultsBox.count() > 0) {
      await expect(resultsBox).toBeHidden();
    }
  });

  test('mobile no results for nonsense query', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.fill('zzzznotapage');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox).toContainText('No results');
  });

  test('no duplicate mobile search inputs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const mobileInputs = page.locator('#dict-search-mobile');
    await expect(mobileInputs).toHaveCount(1);
  });
});

// ── Expanded PAGES Array — Positive ─────────────────────────────────────────

test.describe('Site Search Expanded Pages — Positive', () => {
  test('search finds new site pages like Activities', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('activities');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/activities/"]')).toHaveCount(1);
  });

  test('search finds Achievements page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('achievements');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/achievements/"]')).toHaveCount(1);
  });

  test('search finds FAQ page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('faq');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/faq/"]')).toHaveCount(1);
  });

  test('search finds 60-Second Challenge page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('sixty');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/sixty-seconds/"]')).toHaveCount(1);
  });

  test('search matches on URL path (e.g. "wordbench")', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('wordbench');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/wordbench-practice/"]')).toHaveCount(1);
  });

  test('search finds Roadmap page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('roadmap');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/roadmap/"]')).toHaveCount(1);
  });

  test('desktop dropdown width is 280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const width = await resultsBox.evaluate(el => el.style.width);
    expect(width).toBe('280px');
  });

  test('mobile dropdown width is 100%', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const width = await resultsBox.evaluate(el => el.style.width);
    expect(width).toBe('100%');
  });
});

// ── Expanded PAGES Array — Negative ─────────────────────────────────────────

test.describe('Site Search Expanded Pages — Negative', () => {
  test('search for partial URL that does not exist returns no results', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('/admin/secret');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox).toContainText('No results');
  });

  test('no duplicate results for pages that match on title and URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('achievements');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    // Should only have one link to /achievements/ even though title and URL both match
    await expect(resultsBox.locator('a[href="/achievements/"]')).toHaveCount(1);
  });
});

// ── Search Result Trailing Slash — Positive ─────────────────────────────────

test.describe('Search Result Trailing Slash — Positive', () => {
  test('all search result links have a trailing slash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('guide');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const links = resultsBox.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toBeNull();
      expect(href!.endsWith('/')).toBe(true);
    }
  });

  test('blog category links also have trailing slash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('strategy');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const links = resultsBox.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href!.endsWith('/')).toBe(true);
    }
  });
});

// ── Search Result Trailing Slash — Negative ─────────────────────────────────

test.describe('Search Result Trailing Slash — Negative', () => {
  test('no search result link ends without a trailing slash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('settings');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const links = resultsBox.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      // No link should lack a trailing slash
      expect(href).toMatch(/\/$/);
    }
  });

  test('URLs already ending in slash are not double-slashed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.fill('blog');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const links = resultsBox.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      // Should never have double trailing slash
      expect(href).not.toMatch(/\/\/$/);
    }
  });
});
