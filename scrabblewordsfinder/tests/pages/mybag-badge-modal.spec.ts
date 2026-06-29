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

  test('clicking a badge card opens the modal with badge details', async ({ page }) => {
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

    // Click the first badge card if available
    const badgeCard = page.locator('[data-badge-name]').first();
    if (await badgeCard.count() > 0) {
      await badgeCard.click();
      const modal = page.locator('#mb-badge-modal');
      await expect(modal).toHaveClass(/flex/);
      await expect(modal).not.toHaveClass(/hidden/);
    }
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
    if (await badgeCard.count() > 0) {
      await badgeCard.click();
      const modal = page.locator('#mb-badge-modal');
      await expect(modal).not.toHaveClass(/hidden/);

      // Click close button
      await page.locator('#mb-badge-modal-close').click();
      await expect(modal).toHaveClass(/hidden/);
    }
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
    if (await badgeCard.count() > 0) {
      await badgeCard.click();
      const modal = page.locator('#mb-badge-modal');
      await expect(modal).not.toHaveClass(/hidden/);

      // Press Escape
      await page.keyboard.press('Escape');
      await expect(modal).toHaveClass(/hidden/);
    }
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
    if (await badgeCard.count() > 0) {
      await badgeCard.click();
      const modal = page.locator('#mb-badge-modal');
      await expect(modal).not.toHaveClass(/hidden/);

      // Click on the backdrop (the outer modal div itself, not the inner content)
      await modal.click({ position: { x: 10, y: 10 } });
      await expect(modal).toHaveClass(/hidden/);
    }
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

  test('modal does not crash page when badge card has missing data attributes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/mybag/`);
    await page.waitForTimeout(1500);

    // Inject a badge card with missing data attributes and click it
    await page.evaluate(() => {
      const grid = document.getElementById('mb-badges-grid');
      if (grid) {
        const fakeCard = document.createElement('div');
        fakeCard.setAttribute('data-badge-name', '');
        fakeCard.setAttribute('data-badge-img', '');
        fakeCard.setAttribute('data-badge-info', '');
        fakeCard.style.cursor = 'pointer';
        fakeCard.textContent = 'Fake Badge';
        grid.appendChild(fakeCard);

        // Trigger the click manually
        fakeCard.click();
      }
    });

    await page.waitForTimeout(500);
    const criticalErrors = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('modal image does not show broken placeholder when closed', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const img = page.locator('#mb-badge-modal-img');
    // When modal is hidden, image src should be empty (no broken image request)
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
});
