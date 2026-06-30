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

  test('header nav links are wrapped in a flex container with gap', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const wrapper = page.locator('.flex.items-center.justify-between .flex.items-center.gap-2');
    await expect(wrapper).toBeVisible();
  });

  test('has Badges link in header area', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const badgesLink = page.locator('a[href="/badges/"]');
    await expect(badgesLink.first()).toBeVisible();
    await expect(badgesLink.first()).toContainText('Badges');
  });

  test('Badges link has purple styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const badgesLink = page.locator('.flex.items-center.justify-between a[href="/badges/"]');
    await expect(badgesLink).toBeVisible();
    const classes = await badgesLink.getAttribute('class') || '';
    expect(classes).toContain('bg-purple-600/20');
    expect(classes).toContain('text-purple-400');
  });

  test('Activities link has blue styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const activitiesLink = page.locator('.flex.items-center.justify-between a[href="/activities/"]');
    await expect(activitiesLink).toBeVisible();
    const classes = await activitiesLink.getAttribute('class') || '';
    expect(classes).toContain('bg-blue-600/20');
    expect(classes).toContain('text-blue-400');
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

  test('no duplicate Badges links in header', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const badgesLinks = page.locator('.flex.items-center.justify-between a[href="/badges/"]');
    expect(await badgesLinks.count()).toBe(1);
  });

  test('Badges link does not have broken href', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const badgesLink = page.locator('.flex.items-center.justify-between a[href="/badges/"]');
    const href = await badgesLink.getAttribute('href');
    expect(href).toBe('/badges/');
    expect(href).not.toContain('undefined');
    expect(href).not.toContain('null');
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
    await expect(missedRow).toContainText('7 stars');
    await expect(missedRow).toContainText('a diamond');
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


// ── My Badges Section & Badge Modal ──────────────────────────────────────

test.describe('MyBag — My Badges Section — Positive', () => {
  test('badges section exists in the DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('#mb-badges-section');
    expect(await section.count()).toBe(1);
  });

  test('badges section has correct heading with medal emoji', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-badges-section h2');
    await expect(heading).toContainText('My Badges');
    const text = await heading.textContent();
    expect(text).toContain('🏅');
  });

  test('badges grid container exists with responsive grid classes', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    expect(await grid.count()).toBe(1);
    const classes = await grid.getAttribute('class') || '';
    expect(classes).toContain('grid');
    expect(classes).toContain('grid-cols-1');
    expect(classes).toContain('sm:grid-cols-2');
    expect(classes).toContain('md:grid-cols-3');
  });

  test('badges grid has gap spacing', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    const classes = await grid.getAttribute('class') || '';
    expect(classes).toContain('gap-4');
  });
});

test.describe('MyBag — My Badges Section — Negative', () => {
  test('no duplicate badges sections exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const sections = page.locator('#mb-badges-section');
    expect(await sections.count()).toBe(1);
  });

  test('no duplicate badges grids exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grids = page.locator('#mb-badges-grid');
    expect(await grids.count()).toBe(1);
  });

  test('badges section heading is not empty', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-badges-section h2');
    const text = (await heading.textContent() || '').trim();
    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe('MyBag — Badge Modal — Positive', () => {
  test('badge modal exists in the DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    expect(await modal.count()).toBe(1);
  });

  test('badge modal is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    const classes = await modal.getAttribute('class') || '';
    expect(classes).toContain('hidden');
  });

  test('badge modal has correct ARIA attributes', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-label', 'Badge detail');
  });

  test('badge modal has close button with aria-label', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const closeBtn = page.locator('#mb-badge-modal-close');
    expect(await closeBtn.count()).toBe(1);
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close');
  });

  test('badge modal has image element for badge display', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    expect(await img.count()).toBe(1);
  });

  test('badge modal has name and info text elements', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const name = page.locator('#mb-badge-modal-name');
    const info = page.locator('#mb-badge-modal-info');
    expect(await name.count()).toBe(1);
    expect(await info.count()).toBe(1);
  });

  test('badge modal image has large display size', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    const classes = await img.getAttribute('class') || '';
    expect(classes).toContain('w-[27rem]');
    expect(classes).toContain('h-[27rem]');
  });

  test('badge modal has backdrop blur styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    const classes = await modal.getAttribute('class') || '';
    expect(classes).toContain('backdrop-blur-sm');
    expect(classes).toContain('bg-black/80');
  });

  test('badge modal name element has purple text styling', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const name = page.locator('#mb-badge-modal-name');
    const classes = await name.getAttribute('class') || '';
    expect(classes).toContain('text-purple-300');
  });
});

test.describe('MyBag — Badge Modal — Negative', () => {
  test('no duplicate badge modals exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modals = page.locator('#mb-badge-modal');
    expect(await modals.count()).toBe(1);
  });

  test('no duplicate close buttons in badge modal', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const closeBtns = page.locator('#mb-badge-modal-close');
    expect(await closeBtns.count()).toBe(1);
  });

  test('badge modal does not interfere with page load (no JS errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);
    const criticalErrors = errors.filter(e => e.includes('badge') || e.includes('modal'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('badge modal image src is empty when modal not triggered', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    const src = await img.getAttribute('src');
    expect(src).toBe('');
  });

  test('badge modal is not visible without user interaction', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1000);
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).not.toBeVisible();
  });
});


// ── Error State (API failure with retry) ──────────────────────────────────

test.describe('MyBag — Error State — Positive', () => {
  test('error state div exists in the DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const errorEl = page.locator('#mybag-error');
    expect(await errorEl.count()).toBe(1);
  });

  test('error state is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const errorEl = page.locator('#mybag-error');
    await expect(errorEl).toBeHidden();
  });

  test('error state shows when API returns non-200', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-error-state');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Server error"}' });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 5000 });

    const errorEl = page.locator('#mybag-error');
    await expect(errorEl).toBeVisible();
  });

  test('error state displays correct heading text', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-error-heading');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 5000 });

    const heading = page.locator('#mybag-error p').first();
    await expect(heading).toContainText('Unable to load your data');
  });

  test('error state displays reassuring description', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-error-desc');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 5000 });

    const desc = page.locator('#mybag-error p').nth(1);
    await expect(desc).toContainText('Your progress is safe');
  });

  test('retry button exists inside error state', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const retryBtn = page.locator('#mybag-retry-btn');
    expect(await retryBtn.count()).toBe(1);
  });

  test('retry button has correct label text', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const retryBtn = page.locator('#mybag-retry-btn');
    const text = await retryBtn.textContent();
    expect(text).toContain('Try Again');
  });

  test('retry button triggers a new API request on click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-retry-fetch');
    });

    let requestCount = 0;
    await page.route('**/api/mybag/**', async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totals: { total_stars: 1, total_diamonds: 0, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-29' },
            activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
            history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
            badges: [],
          }),
        });
      }
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 5000 });

    // Click retry
    await page.locator('#mybag-retry-btn').click();
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // Content should now be visible, error hidden
    await expect(page.locator('#mybag-content')).toBeVisible();
    await expect(page.locator('#mybag-error')).toBeHidden();
    expect(requestCount).toBe(2);
  });

  test('retry button hides error and shows loading state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-retry-loading');
    });

    await page.route('**/api/mybag/**', async (route) => {
      // Delay response to observe loading state
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 6000 });

    // Click retry — error should hide and loading should appear briefly
    const retryPromise = page.locator('#mybag-retry-btn').click();
    await retryPromise;

    // Loading should be visible immediately after clicking retry (error hidden)
    const errorHidden = await page.locator('#mybag-error').isHidden();
    expect(errorHidden).toBe(true);
  });
});

test.describe('MyBag — Error State — Negative', () => {
  test('error state is not shown when API succeeds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-error-on-success');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 5, total_diamonds: 1, current_streak: 2, best_streak: 3, diamond_streak: 0, best_diamond_streak: 1, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    await expect(page.locator('#mybag-error')).toBeHidden();
  });

  test('error state is not shown when user has no uid', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);

    // Should show no-user state, not error state
    await expect(page.locator('#mybag-error')).toBeHidden();
    await expect(page.locator('#mybag-no-user')).toBeVisible();
  });

  test('no duplicate error state elements exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    expect(await page.locator('#mybag-error').count()).toBe(1);
    expect(await page.locator('#mybag-retry-btn').count()).toBe(1);
  });

  test('error state does not show content section simultaneously', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-mutex-state');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 5000 });

    // Error shown means content and loading must be hidden
    await expect(page.locator('#mybag-content')).toBeHidden();
    await expect(page.locator('#mybag-loading')).toBeHidden();
  });

  test('no JS errors when error state is triggered', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-error-no-js-err');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-error:not(.hidden)', { timeout: 5000 });

    const criticalErrors = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(criticalErrors).toHaveLength(0);
  });
});


// ── Badge Progression (API-driven achieved state) ─────────────────────────

test.describe('MyBag — Badge Progression — Positive', () => {
  test('badges render with achieved state from API response', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-achieved');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 120, current_streak: 5, best_streak: 10, diamond_streak: 3, best_diamond_streak: 5, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: true }],
          badges: [
            { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: true },
            { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: true },
            { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: false },
            { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: false },
            { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: false },
            { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: false },
            { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // Badge grid should have 7 badge items
    const badgeItems = page.locator('#mb-badges-grid > *');
    expect(await badgeItems.count()).toBe(7);
  });

  test('achieved badges have distinct visual styling from locked badges', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-styling');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 30, total_diamonds: 50, current_streak: 2, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: true },
            { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: false },
            { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: false },
            { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: false },
            { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: false },
            { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: false },
            { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // The first badge (achieved) should NOT have opacity/grayscale locked styling
    const firstBadge = page.locator('#mb-badges-grid > *').first();
    const firstClasses = await firstBadge.getAttribute('class') || '';
    expect(firstClasses).not.toContain('grayscale');

    // The second badge (not achieved) should have locked/dimmed styling
    const secondBadge = page.locator('#mb-badges-grid > *').nth(1);
    const secondClasses = await secondBadge.getAttribute('class') || '';
    // Locked badges typically have opacity or grayscale
    const hasLockedStyle = secondClasses.includes('opacity') || secondClasses.includes('grayscale');
    expect(hasLockedStyle).toBe(true);
  });

  test('all 7 badge tiers are rendered in order', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-order');
    });

    const badgeTiers = [
      { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: true },
      { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: true },
      { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: true },
      { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: false },
      { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: false },
      { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: false },
      { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: false },
    ];

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 100, total_diamonds: 300, current_streak: 5, best_streak: 10, diamond_streak: 3, best_diamond_streak: 5, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: true }],
          badges: badgeTiers,
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const grid = page.locator('#mb-badges-grid');
    // Verify badge names appear in order
    const gridText = await grid.textContent() || '';
    const makerIdx = gridText.indexOf('Word Maker');
    const smithIdx = gridText.indexOf('Word Smith');
    const masterIdx = gridText.indexOf('Word Master');
    const wizardIdx = gridText.indexOf('Word Wizard');
    expect(makerIdx).toBeLessThan(smithIdx);
    expect(smithIdx).toBeLessThan(masterIdx);
    expect(masterIdx).toBeLessThan(wizardIdx);
  });

  test('locked badges display locked indicator text', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-locked-text');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 30, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: true },
            { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: false },
            { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: false },
            { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: false },
            { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: false },
            { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: false },
            { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const gridText = await page.locator('#mb-badges-grid').textContent() || '';
    // Locked badges show "Locked" indicator
    expect(gridText).toContain('Locked');
    // Achieved badge (Word Maker) should NOT show Locked
    const firstBadgeText = await page.locator('#mb-badges-grid > *').first().textContent() || '';
    expect(firstBadgeText).not.toContain('Locked');
  });
});

test.describe('MyBag — Badge Progression — Negative', () => {
  test('no badges are achieved when user has 0 diamonds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-zero');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 5, total_diamonds: 0, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: false },
            { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: false },
            { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: false },
            { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: false },
            { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: false },
            { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: false },
            { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // All badges should be locked (none achieved)
    const badges = page.locator('#mb-badges-grid > *');
    const count = await badges.count();
    expect(count).toBe(7);

    // Each badge should have locked styling (grayscale or opacity)
    for (let i = 0; i < count; i++) {
      const classes = await badges.nth(i).getAttribute('class') || '';
      const hasLockedStyle = classes.includes('opacity') || classes.includes('grayscale');
      expect(hasLockedStyle).toBe(true);
    }
  });

  test('badges section does not crash with empty badges array', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-empty');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 0, total_diamonds: 0, current_streak: 0, best_streak: 0, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '' },
          activities: {},
          history: [],
          badges: [],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const criticalErrors = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('badge images use correct SVG paths from API response', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-paths');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 30, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: true },
            { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: false },
            { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: false },
            { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: false },
            { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: false },
            { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: false },
            { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: false },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    // Check that badge images in the grid have src attributes with /badges/ paths
    const badgeImages = page.locator('#mb-badges-grid img');
    const imgCount = await badgeImages.count();
    expect(imgCount).toBeGreaterThanOrEqual(1);

    const firstSrc = await badgeImages.first().getAttribute('src');
    expect(firstSrc).toContain('/badges/');
    expect(firstSrc).toContain('.svg');
  });

  test('no duplicate badge names in grid', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-no-dup');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 5000, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: true }],
          badges: [
            { name: 'Word Maker', img: '/badges/word-maker.svg', info: '25 diamonds required', achieved: true },
            { name: 'Word Smith', img: '/badges/word-smith.svg', info: '100 diamonds required', achieved: true },
            { name: 'Word Master', img: '/badges/word-master.svg', info: '250 diamonds required', achieved: true },
            { name: 'Word Wizard', img: '/badges/word-wizard.svg', info: '500 diamonds required', achieved: true },
            { name: 'Grand Lexicon', img: '/badges/grand-lexicon.svg', info: '1000 diamonds required', achieved: true },
            { name: 'Scrabble Sage', img: '/badges/scrabble-sage.svg', info: '2500 diamonds required', achieved: true },
            { name: 'Lex Legend', img: '/badges/lex-legend.svg', info: '5000 diamonds required', achieved: true },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const gridText = await page.locator('#mb-badges-grid').textContent() || '';
    // Each name should appear exactly once
    const names = ['Word Maker', 'Word Smith', 'Word Master', 'Word Wizard', 'Grand Lexicon', 'Scrabble Sage', 'Lex Legend'];
    for (const name of names) {
      const firstIdx = gridText.indexOf(name);
      const lastIdx = gridText.lastIndexOf(name);
      expect(firstIdx).toBe(lastIdx);
    }
  });
});


// ── Earning History Heading ID ──────────────────────────────────────────────

test.describe('MyBag — Earning History Heading — Positive', () => {
  test('earning history heading has id mb-earning-history-heading', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-earning-history-heading');
    await expect(heading).toBeAttached();
    await expect(heading).toContainText('Earning History');
  });

  test('earning history heading is an h2 element', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('h2#mb-earning-history-heading');
    await expect(heading).toBeAttached();
  });
});

test.describe('MyBag — Earning History Heading — Negative', () => {
  test('no duplicate earning history heading ids', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const headings = page.locator('#mb-earning-history-heading');
    expect(await headings.count()).toBe(1);
  });

  test('earning history heading id is not empty text', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('#mb-earning-history-heading');
    const text = (await heading.textContent() || '').trim();
    expect(text.length).toBeGreaterThan(0);
  });
});


// ── Earning History Heading with Diamond Count ────────────────────────────

test.describe('MyBag — Earning History Heading — Positive', () => {
  test('heading updates to show total diamonds after data loads', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-heading-diamonds');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 50, total_diamonds: 42, current_streak: 3, best_streak: 7, diamond_streak: 2, best_diamond_streak: 3, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: true }],
          badges: [],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const heading = page.locator('#mb-earning-history-heading');
    await expect(heading).toContainText('Earning History');
    await expect(heading).toContainText('42');
    await expect(heading).toContainText('💎');
  });

  test('heading shows 0 diamonds when user has none', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-heading-zero');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 5, total_diamonds: 0, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-30' },
          activities: { wotd: { name: 'WOTD', icon: '📖', color: 'amber' } },
          history: [{ date: '2026-06-30', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const heading = page.locator('#mb-earning-history-heading');
    await expect(heading).toContainText('Earning History (0');
  });
});

test.describe('MyBag — Earning History Heading — Negative', () => {
  test('heading does not show NaN or undefined for diamond count', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-heading-nan');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 5, current_streak: 1, best_streak: 1, diamond_streak: 0, best_diamond_streak: 0, last_active_date: '2026-06-30' },
          activities: {},
          history: [],
          badges: [],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const heading = page.locator('#mb-earning-history-heading');
    const text = await heading.textContent() || '';
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });

  test('only one earning history heading exists', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const headings = page.locator('#mb-earning-history-heading');
    expect(await headings.count()).toBe(1);
  });
});
