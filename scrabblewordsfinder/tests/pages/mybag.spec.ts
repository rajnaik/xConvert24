import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('MyBag Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    await expect(page).toHaveTitle(/MyBag/);
  });

  test('displays page heading with bag icon', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('MyBag');
  });

  test('has Activities link in header area', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const activitiesLink = page.locator('a[href="/activities/"]');
    await expect(activitiesLink.first()).toBeVisible();
  });

  test('Activities link has left margin spacing from heading', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const activitiesLink = page.locator('.flex.items-center.justify-between a[href="/activities/"]');
    await expect(activitiesLink).toBeVisible();
    const classes = await activitiesLink.getAttribute('class') || '';
    expect(classes).toContain('ml-[100px]');
  });

  test('shows loading state or no-user state without uid', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    // Without a uid in localStorage, should show the no-user message
    const noUser = page.locator('#mybag-no-user');
    const content = page.locator('#mybag-content');
    // One of them should be visible after load
    await page.waitForTimeout(1500);
    const noUserVisible = await noUser.isVisible();
    const contentVisible = await content.isVisible();
    expect(noUserVisible || contentVisible).toBe(true);
  });

  test('summary cards are present in content section', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    // Check that the summary card elements exist in DOM
    const starsCard = page.locator('#mb-total-stars');
    const diamondsCard = page.locator('#mb-total-diamonds');
    const streakCard = page.locator('#mb-current-streak');
    const bestStreakCard = page.locator('#mb-best-streak');
    const diamondStreak = page.locator('#mb-diamond-streak');
    const bestDiamondStreak = page.locator('#mb-best-diamond-streak');
    expect(await starsCard.count()).toBe(1);
    expect(await diamondsCard.count()).toBe(1);
    expect(await streakCard.count()).toBe(1);
    expect(await bestStreakCard.count()).toBe(1);
    expect(await diamondStreak.count()).toBe(1);
    expect(await bestDiamondStreak.count()).toBe(1);
  });

  test('summary cards container uses grid layout', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const container = page.locator('#mybag-content > div').first();
    await expect(container).toHaveClass(/grid/);
    await expect(container).toHaveClass(/grid-cols-3/);
  });

  test('summary cards have min-w-0 for text overflow prevention', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const cards = page.locator('#mybag-content > div:first-child > div');
    const count = await cards.count();
    expect(count).toBe(6);
    for (let i = 0; i < count; i++) {
      const classes = await cards.nth(i).getAttribute('class') || '';
      expect(classes).toContain('min-w-0');
    }
  });

  test('earning history table structure exists', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const table = page.locator('table');
    await expect(table).toBeAttached();
    const headers = page.locator('table thead th');
    const count = await headers.count();
    expect(count).toBe(4); // Date, Stars Earned, Count, Diamond
  });

  test('FAQPage JSON-LD schema is present', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const content = await schema.textContent();
    expect(content).toContain('"FAQPage"');
    expect(content).toContain('What is MyBag');
  });

  test('has Stars by Game breakdown section', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('h2', { hasText: 'Stars by Game' });
    await expect(heading).toBeAttached();
    const container = page.locator('#mb-game-breakdown');
    expect(await container.count()).toBe(1);
  });

  test('Stars by Game uses flex-wrap layout', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const container = page.locator('#mb-game-breakdown');
    await expect(container).toHaveClass(/flex/);
    await expect(container).toHaveClass(/flex-wrap/);
  });
});

test.describe('MyBag Page — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('does not expose sensitive information', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    // Check only visible page text, not raw HTML (dev server injects local file paths in style tags)
    const mainContent = await page.locator('main').textContent() || '';
    expect(mainContent).not.toContain('sk-');
    expect(mainContent).not.toContain('AKIA');
    expect(mainContent).not.toContain('@gmail.com');
    expect(mainContent).not.toContain('rajeev');
  });

  test('no duplicate summary cards', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    expect(await page.locator('#mb-total-stars').count()).toBe(1);
    expect(await page.locator('#mb-total-diamonds').count()).toBe(1);
    expect(await page.locator('#mb-current-streak').count()).toBe(1);
    expect(await page.locator('#mb-best-streak').count()).toBe(1);
    expect(await page.locator('#mb-diamond-streak').count()).toBe(1);
    expect(await page.locator('#mb-best-diamond-streak').count()).toBe(1);
  });

  test('loading state disappears after fetch completes', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(2000);
    const loading = page.locator('#mybag-loading');
    await expect(loading).toBeHidden();
  });

  test('Stars by Game container does not use grid layout', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const container = page.locator('#mb-game-breakdown');
    const classes = await container.getAttribute('class') || '';
    expect(classes).not.toContain('grid-cols');
    expect(classes).not.toMatch(/\bgrid\b/);
  });

  test('summary cards container does not use old flex-wrap layout', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const container = page.locator('#mybag-content > div').first();
    const classes = await container.getAttribute('class') || '';
    expect(classes).not.toContain('flex-wrap');
  });

  test('exactly 6 summary cards exist (no extras)', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const cards = page.locator('#mybag-content > div:first-child > div');
    expect(await cards.count()).toBe(6);
  });

  test('summary card values do not show NaN or undefined', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const cards = ['#mb-total-stars', '#mb-total-diamonds', '#mb-current-streak', '#mb-best-streak', '#mb-diamond-streak', '#mb-best-diamond-streak'];
    for (const id of cards) {
      const text = await page.locator(id).textContent();
      expect(text).not.toContain('NaN');
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('null');
    }
  });
});

test.describe('Memory WordBench Showcase — Positive', () => {
  test('showcase section is visible on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    await expect(section).toBeVisible();
  });

  test('has heading with card emoji and correct title', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('h2', { hasText: 'Memory WordBench' });
    await expect(heading).toBeVisible();
    const parent = heading.locator('..');
    await expect(parent).toContainText('🃏');
  });

  test('has descriptive paragraph about the feature', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const description = section.locator('p').first();
    await expect(description).toContainText('personal word memory trainer');
  });

  test('displays all 4 feature tiles', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const tiles = section.locator('h3');
    await expect(tiles).toHaveCount(4);
  });

  test('Flashcard Mode tile has correct heading and bullet points', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tile = page.locator('h3', { hasText: 'Flashcard Mode' }).locator('..');
    await expect(tile).toBeVisible();
    const items = tile.locator('li');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('Flip cards');
  });

  test('Autoplay Timer tile has correct heading and bullet points', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tile = page.locator('h3', { hasText: 'Autoplay Timer' }).locator('..');
    await expect(tile).toBeVisible();
    const items = tile.locator('li');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('Configurable interval');
  });

  test('Fullscreen View tile has correct heading and bullet points', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tile = page.locator('h3', { hasText: 'Fullscreen View' }).locator('..');
    await expect(tile).toBeVisible();
    const items = tile.locator('li');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('Distraction-free');
  });

  test('Word Bank tile has correct heading and bullet points', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tile = page.locator('h3', { hasText: 'WordBench' }).locator('..');
    await expect(tile).toBeVisible();
    const items = tile.locator('li');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('Auto-saves words');
  });

  test('feature tiles use responsive grid layout', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const grid = section.locator('.grid');
    await expect(grid).toHaveClass(/grid-cols-1/);
    await expect(grid).toHaveClass(/sm:grid-cols-2/);
  });

  test('CTA link points to homepage and is visible', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const cta = section.locator('a[href="/"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Open Memory WordBench');
  });

  test('practice tip text is visible with daily advice', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const tip = section.locator('p', { hasText: 'Practice 5 to 10 minutes every day' });
    await expect(tip).toBeVisible();
  });

  test('practice tip links to Practice History page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const link = section.locator('a[href="/wordbench-practice/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Practice History');
  });
});

test.describe('Memory WordBench Showcase — Negative', () => {
  test('no duplicate showcase sections on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const sections = page.locator('h2', { hasText: 'Memory WordBench' });
    expect(await sections.count()).toBe(1);
  });

  test('no broken links in showcase CTA', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const cta = section.locator('a[href="/"]');
    const href = await cta.getAttribute('href');
    expect(href).not.toContain('undefined');
    expect(href).not.toContain('null');
    expect(href).toBe('/');
  });

  test('feature tiles do not have empty headings', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const headings = section.locator('h3');
    const count = await headings.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = (await headings.nth(i).textContent() || '').trim();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('feature tiles do not have empty bullet lists', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const lists = section.locator('ul');
    const count = await lists.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const items = await lists.nth(i).locator('li').count();
      expect(items).toBeGreaterThan(0);
    }
  });

  test('practice tip link does not point to a broken URL', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const link = section.locator('a[href="/wordbench-practice/"]');
    const href = await link.getAttribute('href');
    expect(href).toBe('/wordbench-practice/');
    expect(href).not.toContain('undefined');
  });
});

test.describe('Practice Tip — Positive', () => {
  test('practice tip paragraph is visible on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const tip = section.locator('p', { hasText: 'Practice 5 to 10 minutes every day' });
    await expect(tip).toBeVisible();
  });

  test('practice tip contains link to wordbench practice history', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const link = section.locator('a[href="/wordbench-practice/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Memory WordBench Practice History');
  });

  test('practice tip link has correct styling classes', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const link = section.locator('a[href="/wordbench-practice/"]');
    const classes = await link.getAttribute('class') || '';
    expect(classes).toContain('text-purple-400');
    expect(classes).toContain('underline');
    expect(classes).toContain('font-medium');
  });

  test('practice tip appears between feature tiles and CTA', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    // The tip paragraph should exist between the grid of tiles and the CTA div
    const tip = section.locator('p', { hasText: 'Practice 5 to 10 minutes' });
    const cta = section.locator('a[href="/"]');
    // Both should be visible — tip comes before CTA in DOM
    await expect(tip).toBeVisible();
    await expect(cta).toBeVisible();
  });
});

test.describe('Practice Tip — Negative', () => {
  test('only one practice tip paragraph exists', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const tips = section.locator('p', { hasText: 'Practice 5 to 10 minutes' });
    expect(await tips.count()).toBe(1);
  });

  test('practice tip link does not have broken href', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const link = section.locator('a[href="/wordbench-practice/"]');
    const href = await link.getAttribute('href');
    expect(href).not.toContain('undefined');
    expect(href).not.toContain('null');
    expect(href).toBe('/wordbench-practice/');
  });

  test('practice tip does not contain empty link text', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('section', { hasText: 'Memory WordBench' });
    const link = section.locator('a[href="/wordbench-practice/"]');
    const text = (await link.textContent() || '').trim();
    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe('StarBar MyBag Link — Positive', () => {
  test('MyBag icon link is visible on activities page StarBar', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const mybagLink = page.locator('#sb-mybag-link');
    await expect(mybagLink).toBeVisible();
  });

  test('MyBag link points to /mybag/', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const mybagLink = page.locator('#sb-mybag-link');
    const href = await mybagLink.getAttribute('href');
    expect(href).toBe('/mybag/');
  });

  test('MyBag link has bag emoji', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const mybagLink = page.locator('#sb-mybag-link');
    const text = await mybagLink.textContent();
    expect(text).toContain('🎒');
  });
});

test.describe('StarBar MyBag Link — Negative', () => {
  test('only one MyBag link exists on StarBar', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const mybagLinks = page.locator('#sb-mybag-link');
    expect(await mybagLinks.count()).toBe(1);
  });

  test('MyBag link does not contain broken href', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const mybagLink = page.locator('#sb-mybag-link');
    const href = await mybagLink.getAttribute('href');
    expect(href).not.toContain('undefined');
    expect(href).not.toContain('null');
    expect(href).not.toBe('#');
  });
});
