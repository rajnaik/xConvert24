import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('MyBag Badge Modal — Positive', () => {
  test('badge modal element exists in DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    expect(await modal.count()).toBe(1);
  });

  test('badge modal is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).toHaveClass(/hidden/);
    await expect(modal).not.toBeVisible();
  });

  test('badge modal has correct ARIA attributes', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-label', 'Badge detail');
  });

  test('badge modal has close button with accessible label', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const closeBtn = page.locator('#mb-badge-modal-close');
    expect(await closeBtn.count()).toBe(1);
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close');
  });

  test('badge modal contains image, name, and info elements', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    expect(await page.locator('#mb-badge-modal-img').count()).toBe(1);
    expect(await page.locator('#mb-badge-modal-name').count()).toBe(1);
    expect(await page.locator('#mb-badge-modal-info').count()).toBe(1);
  });

  test('badges section exists in page', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const section = page.locator('#mb-badges-section');
    expect(await section.count()).toBe(1);
    const heading = section.locator('h2');
    await expect(heading).toContainText('My Badges');
  });

  test('badges grid exists inside badges section', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    expect(await grid.count()).toBe(1);
    await expect(grid).toHaveClass(/grid/);
  });

  test('clicking a badge card opens the modal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-modal');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 2, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '\u{1F4D6}', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { id: 'first-star', name: 'First Star', img: '/badges/first-star.svg', info: 'Earned your first star', achieved: true },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const badgeCard = page.locator('[data-badge-name]').first();
    await badgeCard.click();
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).toHaveClass(/flex/);
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('close button dismisses the modal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-close');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 2, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '\u{1F4D6}', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { id: 'first-star', name: 'First Star', img: '/badges/first-star.svg', info: 'Earned your first star', achieved: true },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const badgeCard = page.locator('[data-badge-name]').first();
    await badgeCard.click();
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);

    await page.locator('#mb-badge-modal-close').click();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('Escape key closes the modal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-escape');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 2, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '\u{1F4D6}', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { id: 'first-star', name: 'First Star', img: '/badges/first-star.svg', info: 'Earned your first star', achieved: true },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const badgeCard = page.locator('[data-badge-name]').first();
    await badgeCard.click();
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);

    await page.keyboard.press('Escape');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('clicking backdrop closes the modal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-badge-backdrop');
    });

    await page.route('**/api/mybag/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totals: { total_stars: 10, total_diamonds: 2, current_streak: 3, best_streak: 5, diamond_streak: 1, best_diamond_streak: 2, last_active_date: '2026-06-29' },
          activities: { wotd: { name: 'WOTD', icon: '\u{1F4D6}', color: 'amber' } },
          history: [{ date: '2026-06-29', stars: ['wotd'], stars_count: 1, diamond: false }],
          badges: [
            { id: 'first-star', name: 'First Star', img: '/badges/first-star.svg', info: 'Earned your first star', achieved: true },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/mybag/`);
    await page.waitForSelector('#mybag-content:not(.hidden)', { timeout: 5000 });

    const badgeCard = page.locator('[data-badge-name]').first();
    await badgeCard.click();
    const modal = page.locator('#mb-badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);

    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).toHaveClass(/hidden/);
  });
});

test.describe('MyBag Badge Modal — Negative', () => {
  test('no duplicate badge modal elements exist', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    expect(await page.locator('#mb-badge-modal').count()).toBe(1);
    expect(await page.locator('#mb-badge-modal-close').count()).toBe(1);
    expect(await page.locator('#mb-badge-modal-img').count()).toBe(1);
    expect(await page.locator('#mb-badge-modal-name').count()).toBe(1);
    expect(await page.locator('#mb-badge-modal-info').count()).toBe(1);
  });

  test('modal image does not show broken placeholder when closed', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    const src = await img.getAttribute('src');
    expect(src).toBe('');
  });

  test('no JS errors from badge modal event listeners on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(2000);
    const modalErrors = errors.filter(e =>
      e.includes('mb-badge-modal') || e.includes('closeBadgeModal') || e.includes('openBadgeModal')
    );
    expect(modalErrors).toHaveLength(0);
  });

  test('badges section shows placeholder when no badges earned', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-badges');
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

    const grid = page.locator('#mb-badges-grid');
    await expect(grid).toContainText('No badges earned yet');
  });
});
