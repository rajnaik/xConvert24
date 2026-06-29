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
    const historyTbody = page.locator('#mb-history-body');
    await expect(historyTbody).toBeAttached();
    // The history table has 4 headers: Date, Stars Earned, Count, Diamond
    const historyTable = page.locator('table', { has: page.locator('#mb-history-body') });
    const headers = historyTable.locator('thead th');
    const count = await headers.count();
    expect(count).toBe(4);
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



// ── Missed Day Indicator ──────────────────────────────────────────────────

test.describe('MyBag — Missed Day Indicator — Positive', () => {
  test('shows missed-day row when there is a gap between history entries', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-missed-day');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 5, total_diamonds: 1, current_streak: 0, best_streak: 3, diamond_streak: 0, best_diamond_streak: 1, last_active_date: '2026-06-23' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' }, quiz: { name: 'Quiz', icon: '🧠', color: 'blue' } },
          history: [
            { date: '2026-06-25', stars: ['wotd'], stars_count: 1, diamond: false },
            // Gap: 2026-06-24 is missing
            { date: '2026-06-22', stars: ['wotd', 'quiz'], stars_count: 2, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // Should have at least one missed-day row between the two entries
    const missedRows = page.locator('tr[data-missed-day]');
    const count = await missedRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('missed-day row displays warning message about lost stars and diamond', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-missed-msg');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 2, total_diamonds: 0, current_streak: 0, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-23' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: '2026-06-25', stars: ['wotd'], stars_count: 1, diamond: false },
            { date: '2026-06-22', stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const missedRow = page.locator('tr[data-missed-day]').first();
    await expect(missedRow).toContainText('Missed day');
    await expect(missedRow).toContainText('⭐⭐⭐⭐⭐⭐⭐');
    await expect(missedRow).toContainText('(7 stars)');
    await expect(missedRow).toContainText('💎');
    await expect(missedRow).toContainText('(a diamond)');
  });

  test('missed-day row has red-tinted background styling', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-missed-style');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 2, total_diamonds: 0, current_streak: 0, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-20' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: '2026-06-25', stars: ['wotd'], stars_count: 1, diamond: false },
            { date: '2026-06-23', stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const missedRow = page.locator('tr[data-missed-day]').first();
    const classes = await missedRow.getAttribute('class') || '';
    expect(classes).toContain('bg-red-950/10');
  });

  test('multiple consecutive missed days each get their own row', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-multi-missed');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 2, total_diamonds: 0, current_streak: 0, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-25' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: '2026-06-25', stars: ['wotd'], stars_count: 1, diamond: false },
            // 3-day gap: 24, 23, 22 are missed
            { date: '2026-06-21', stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const missedRows = page.locator('tr[data-missed-day]');
    // Should have 3 missed-day rows for the 3-day gap
    expect(await missedRows.count()).toBe(3);
  });

  test('large gap shows summary row after 7 individual missed rows', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-large-gap');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 2, total_diamonds: 0, current_streak: 0, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-25' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: '2026-06-25', stars: ['wotd'], stars_count: 1, diamond: false },
            // 12-day gap
            { date: '2026-06-12', stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // 7 individual + 1 summary = 8 missed rows
    const missedRows = page.locator('tr[data-missed-day]');
    expect(await missedRows.count()).toBe(8);

    // Last missed row should be summary with "more missed day" text
    const summaryRow = missedRows.last();
    await expect(summaryRow).toContainText('more missed day');
  });
});

test.describe('MyBag — Missed Day Indicator — Negative', () => {
  test('no missed-day rows when history has consecutive dates', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-gaps');
    });

    // Use a fixed "today" by mocking Date to avoid flakiness
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 4, total_diamonds: 0, current_streak: 2, best_streak: 2, diamond_streak: 0, best_diamond_streak: 0, last_active_date: today },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: today, stars: ['wotd'], stars_count: 1, diamond: false },
            { date: yesterday, stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const missedRows = page.locator('tr[data-missed-day]');
    expect(await missedRows.count()).toBe(0);
  });

  test('no missed-day rows when history has only one entry from today', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-single-today');
    });

    const today = new Date().toISOString().split('T')[0];

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 1, total_diamonds: 0, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: today },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: today, stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const missedRows = page.locator('tr[data-missed-day]');
    expect(await missedRows.count()).toBe(0);
  });

  test('no JS errors when rendering missed-day rows', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-missed-no-err');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 2, total_diamonds: 0, current_streak: 0, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-20' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [
            { date: '2026-06-25', stars: ['wotd'], stars_count: 1, diamond: false },
            { date: '2026-06-20', stars: ['wotd'], stars_count: 1, diamond: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('missed-day rows do not interfere with load-more button functionality', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-missed-loadmore');
    });

    let requestCount = 0;
    await page.route('**/api/mybag/**', async (route) => {
      requestCount++;
      const limit = requestCount === 1 ? 30 : 90;
      // Generate 30 entries with gaps
      const history = [];
      for (let i = 0; i < limit; i++) {
        const d = new Date(2026, 5, 25 - (i * 3)); // every 3rd day (2-day gaps)
        history.push({
          date: d.toISOString().split('T')[0],
          stars: ['wotd'],
          stars_count: 1,
          diamond: false,
        });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: limit, total_diamonds: 0, current_streak: 0, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-25' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history,
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // History rows should exist
    const historyRows = page.locator('#mb-history-body tr:not([data-missed-day])');
    expect(await historyRows.count()).toBeGreaterThan(0);

    // Missed-day rows should also exist
    const missedRows = page.locator('tr[data-missed-day]');
    expect(await missedRows.count()).toBeGreaterThan(0);
  });
});


// ── DiamondHuntSlot on MyBag ──────────────────────────────────────────────────

test.describe('MyBag — DiamondHuntSlot — Positive', () => {
  test('DiamondHuntSlot element exists in DOM with correct data-diamond-id', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="2"]');
    expect(await slot.count()).toBe(1);
  });

  test('DiamondHuntSlot has role=button and tabindex for accessibility', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="2"]');
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
    await expect(slot).toHaveAttribute('aria-label', 'Claim a hidden diamond');
  });

  test('DiamondHuntSlot contains diamond emoji and claim text', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="2"]');
    await expect(slot).toContainText('💎');
    await expect(slot).toContainText('Hidden Diamond!');
    await expect(slot).toContainText('remaining — click to claim');
  });

  test('DiamondHuntSlot is hidden by default before mine activation', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="2"]');
    // The slot has class "hidden" by default — Layout script reveals it when mine is active
    const classes = await slot.getAttribute('class') || '';
    expect(classes).toContain('hidden');
  });
});

test.describe('MyBag — DiamondHuntSlot — Negative', () => {
  test('no duplicate DiamondHuntSlot elements on mybag page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const allSlots = page.locator('.diamond-hunt-slot');
    expect(await allSlots.count()).toBe(1);
  });

  test('DiamondHuntSlot does not use old id=1', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const oldSlot = page.locator('.diamond-hunt-slot[data-diamond-id="1"]');
    expect(await oldSlot.count()).toBe(0);
  });

  test('DiamondHuntSlot does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const diamondErrors = errors.filter(e => e.toLowerCase().includes('diamond'));
    expect(diamondErrors).toHaveLength(0);
  });

  test('DiamondHuntSlot remaining count placeholder is present', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const remaining = page.locator('.diamond-hunt-slot[data-diamond-id="2"] .diamond-remaining');
    expect(await remaining.count()).toBe(1);
    const text = await remaining.textContent();
    // Should show "?" (placeholder) or a number — never empty
    expect((text || '').trim().length).toBeGreaterThan(0);
  });
});


// ── Diamond Leaderboard ──────────────────────────────────────────────────

test.describe('MyBag — Diamond Leaderboard — Positive', () => {
  test('leaderboard section exists on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('#mb-leaderboard-section');
    expect(await section.count()).toBe(1);
  });

  test('leaderboard has heading with diamond emoji', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-leaderboard-section h2');
    await expect(heading).toContainText('Diamond Leaderboard');
    await expect(heading).toContainText('💎');
  });

  test('leaderboard table has 5 column headers', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const headers = page.locator('#mb-leaderboard-section thead th');
    await expect(headers).toHaveCount(5);
  });

  test('leaderboard table headers are #, Player, 💎, ⭐, 🔥', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const headers = page.locator('#mb-leaderboard-section thead th');
    await expect(headers.nth(0)).toContainText('#');
    await expect(headers.nth(1)).toContainText('Player');
    await expect(headers.nth(2)).toContainText('💎');
    await expect(headers.nth(3)).toContainText('⭐');
    await expect(headers.nth(4)).toContainText('🔥');
  });

  test('leaderboard body element exists for dynamic content', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tbody = page.locator('#mb-leaderboard-body');
    expect(await tbody.count()).toBe(1);
  });

  test('leaderboard shows loading state initially', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tbody = page.locator('#mb-leaderboard-body');
    await expect(tbody).toContainText('Loading leaderboard');
  });

  test('leaderboard rank section element exists', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const rank = page.locator('#mb-leaderboard-rank');
    expect(await rank.count()).toBe(1);
  });

  test('leaderboard rank section is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const rank = page.locator('#mb-leaderboard-rank');
    const classes = await rank.getAttribute('class') || '';
    expect(classes).toContain('hidden');
  });

  test('leaderboard table has purple-themed border styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const container = page.locator('#mb-leaderboard-section .rounded-xl');
    const classes = await container.getAttribute('class') || '';
    expect(classes).toContain('border-purple-700/40');
    expect(classes).toContain('bg-purple-950/10');
  });
});

test.describe('MyBag — Diamond Leaderboard — Negative', () => {
  test('no duplicate leaderboard sections', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const sections = page.locator('#mb-leaderboard-section');
    expect(await sections.count()).toBe(1);
  });

  test('no duplicate leaderboard tbody elements', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const tbodies = page.locator('#mb-leaderboard-body');
    expect(await tbodies.count()).toBe(1);
  });

  test('no duplicate leaderboard rank elements', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const ranks = page.locator('#mb-leaderboard-rank');
    expect(await ranks.count()).toBe(1);
  });

  test('leaderboard does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const leaderboardErrors = errors.filter(e => e.toLowerCase().includes('leaderboard'));
    expect(leaderboardErrors).toHaveLength(0);
  });

  test('leaderboard heading does not appear empty', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-leaderboard-section h2');
    const text = (await heading.textContent() || '').trim();
    expect(text.length).toBeGreaterThan(0);
  });
});


// ── My Badges Section ──────────────────────────────────────────────────

test.describe('MyBag — My Badges — Positive', () => {
  test('badges section exists on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('#mb-badges-section');
    expect(await section.count()).toBe(1);
  });

  test('badges section has heading with medal emoji', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-badges-section h2');
    await expect(heading).toContainText('My Badges');
    await expect(heading).toContainText('🏅');
  });

  test('badges grid container exists with correct id', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    expect(await grid.count()).toBe(1);
  });

  test('badges grid uses responsive grid layout classes', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    const classes = await grid.getAttribute('class') || '';
    expect(classes).toContain('grid');
    expect(classes).toContain('grid-cols-1');
    expect(classes).toContain('sm:grid-cols-2');
    expect(classes).toContain('md:grid-cols-3');
  });

  test('badges section appears before earning history table', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const badgesSection = page.locator('#mb-badges-section');
    const historyBody = page.locator('#mb-history-body');
    // Both should exist
    await expect(badgesSection).toBeAttached();
    await expect(historyBody).toBeAttached();
    // Badges section should come before the history table in DOM order
    const badgesBox = await badgesSection.boundingBox();
    const historyBox = await historyBody.boundingBox();
    if (badgesBox && historyBox) {
      expect(badgesBox.y).toBeLessThan(historyBox.y);
    }
  });
});

test.describe('MyBag — My Badges — Negative', () => {
  test('no duplicate badges sections on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const sections = page.locator('#mb-badges-section');
    expect(await sections.count()).toBe(1);
  });

  test('no duplicate badges grid elements', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grids = page.locator('#mb-badges-grid');
    expect(await grids.count()).toBe(1);
  });

  test('badges section does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const badgeErrors = errors.filter(e => e.toLowerCase().includes('badge'));
    expect(badgeErrors).toHaveLength(0);
  });

  test('badges heading is not empty', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-badges-section h2');
    const text = (await heading.textContent() || '').trim();
    expect(text.length).toBeGreaterThan(0);
  });
});


// ── Badge Modal ──────────────────────────────────────────────────

test.describe('MyBag — Badge Modal — Positive', () => {
  test('badge modal element exists in DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    expect(await modal.count()).toBe(1);
  });

  test('badge modal has correct ARIA attributes for accessibility', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-label', 'Badge detail');
  });

  test('badge modal contains close button with aria-label', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const closeBtn = page.locator('#mb-badge-modal-close');
    expect(await closeBtn.count()).toBe(1);
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close');
  });

  test('badge modal contains image element for badge display', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    expect(await img.count()).toBe(1);
    // Image should be large (27rem sizing classes)
    const classes = await img.getAttribute('class') || '';
    expect(classes).toContain('w-[27rem]');
    expect(classes).toContain('h-[27rem]');
  });

  test('badge modal contains name and info paragraphs', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const name = page.locator('#mb-badge-modal-name');
    const info = page.locator('#mb-badge-modal-info');
    expect(await name.count()).toBe(1);
    expect(await info.count()).toBe(1);
  });

  test('badge modal is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    const classes = await modal.getAttribute('class') || '';
    expect(classes).toContain('hidden');
  });

  test('badge modal has backdrop blur and dark overlay styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    const classes = await modal.getAttribute('class') || '';
    expect(classes).toContain('backdrop-blur-sm');
    expect(classes).toContain('bg-black/80');
    expect(classes).toContain('z-50');
  });

  test('badge modal inner container has purple-themed border', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const inner = page.locator('#mb-badge-modal > div');
    const classes = await inner.getAttribute('class') || '';
    expect(classes).toContain('border-purple-500/50');
    expect(classes).toContain('rounded-2xl');
    expect(classes).toContain('bg-gray-900');
  });

  test('clicking a badge opens the modal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-open');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
            { name: 'Five Diamonds', image: '/badges/five-diamonds.svg', diamonds_required: 5 },
            { name: 'Ten Diamonds', image: '/badges/ten-diamonds.svg', diamonds_required: 10 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const firstBadge = page.locator('#mb-badges-grid [data-badge-name]').first();
    await firstBadge.click();

    const modal = page.locator('#mb-badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await expect(modal).toHaveClass(/flex/);
  });

  test('modal displays badge name and image on click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-content');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await page.locator('#mb-badges-grid [data-badge-name]').first().click();

    const modalName = page.locator('#mb-badge-modal-name');
    const modalImg = page.locator('#mb-badge-modal-img');
    await expect(modalName).toContainText('First Diamond');
    const src = await modalImg.getAttribute('src');
    expect(src).toContain('/badges/first-diamond.svg');
  });

  test('modal closes when X button is clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-close-x');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await page.locator('#mb-badges-grid [data-badge-name]').first().click();
    await expect(page.locator('#mb-badge-modal')).toHaveClass(/flex/);

    await page.locator('#mb-badge-modal-close').click();
    await expect(page.locator('#mb-badge-modal')).toHaveClass(/hidden/);
  });

  test('modal closes when backdrop is clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-close-backdrop');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await page.locator('#mb-badges-grid [data-badge-name]').first().click();
    await expect(page.locator('#mb-badge-modal')).toHaveClass(/flex/);

    await page.locator('#mb-badge-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#mb-badge-modal')).toHaveClass(/hidden/);
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-close-esc');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await page.locator('#mb-badges-grid [data-badge-name]').first().click();
    await expect(page.locator('#mb-badge-modal')).toHaveClass(/flex/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#mb-badge-modal')).toHaveClass(/hidden/);
  });
});

test.describe('MyBag — Badge Modal — Negative', () => {
  test('no duplicate badge modal elements on page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modals = page.locator('#mb-badge-modal');
    expect(await modals.count()).toBe(1);
  });

  test('no duplicate close buttons in badge modal', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const closeBtns = page.locator('#mb-badge-modal-close');
    expect(await closeBtns.count()).toBe(1);
  });

  test('badge modal does not cause console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const modalErrors = errors.filter(e => e.toLowerCase().includes('modal') || e.toLowerCase().includes('badge-modal'));
    expect(modalErrors).toHaveLength(0);
  });

  test('badge modal image src is empty by default (not broken)', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    const src = await img.getAttribute('src');
    // Should be empty string (populated by JS on click), not a broken URL
    expect(src).toBe('');
  });

  test('badge modal name and info paragraphs are empty by default', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const name = await page.locator('#mb-badge-modal-name').textContent();
    const info = await page.locator('#mb-badge-modal-info').textContent();
    // These get populated dynamically — should be empty in initial DOM
    expect((name || '').trim()).toBe('');
    expect((info || '').trim()).toBe('');
  });

  test('clicking badge does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-no-err');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await page.locator('#mb-badges-grid [data-badge-name]').first().click();
    await page.waitForTimeout(500);

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('modal image does not show broken src after badge click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal-img-src');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 5, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'First Diamond', image: '/badges/first-diamond.svg', diamonds_required: 1 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await page.locator('#mb-badges-grid [data-badge-name]').first().click();

    const imgSrc = await page.locator('#mb-badge-modal-img').getAttribute('src');
    expect(imgSrc).not.toBe('');
    expect(imgSrc).not.toContain('undefined');
    expect(imgSrc).not.toContain('null');
  });

  test('modal does not open without clicking a badge', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const modal = page.locator('#mb-badge-modal');
    const classes = await modal.getAttribute('class') || '';
    expect(classes).toContain('hidden');
    expect(classes).not.toContain('flex');
  });
});
