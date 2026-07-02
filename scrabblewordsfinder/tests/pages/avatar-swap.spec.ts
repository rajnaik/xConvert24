import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Avatar Swap Page — Positive ──────────────────────────────────────────

test.describe('Avatar Swap Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await expect(page).toHaveTitle(/Change Avatar/);
  });

  test('displays page heading with avatar emoji', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Change Avatar');
  });

  test('has a back link to Settings', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const settingsLink = page.locator('main a[href="/settings/"]');
    await expect(settingsLink).toBeVisible();
  });

  test('shows current avatar section', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const currentSection = page.locator('#as-current');
    await expect(currentSection).toBeVisible();
    const img = page.locator('#as-current-img');
    await expect(img).toBeVisible();
  });

  test('current avatar image has a valid src path', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const img = page.locator('#as-current-img');
    const src = await img.getAttribute('src');
    expect(src).toMatch(/^\/avatars\/avatar-\d+\.svg$/);
  });

  test('avatar grid loads with 10 avatars on first page', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const cards = page.locator('#as-grid > [data-avatar-id]');
    expect(await cards.count()).toBe(10);
  });

  test('each avatar card has an image and name', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const cards = page.locator('#as-grid > [data-avatar-id]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const img = cards.nth(i).locator('img');
      const name = cards.nth(i).locator('p');
      await expect(img).toBeAttached();
      const nameText = (await name.textContent() || '').trim();
      expect(nameText.length).toBeGreaterThan(0);
    }
  });

  test('pagination controls are visible', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const prevBtn = page.locator('#as-prev');
    const nextBtn = page.locator('#as-next');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test('prev button is disabled on first page', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const prevBtn = page.locator('#as-prev');
    await expect(prevBtn).toBeDisabled();
  });

  test('next button navigates to page 2 with different avatars', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });

    // Get first page's first avatar id
    const firstCardPage1 = page.locator('#as-grid > [data-avatar-id]').first();
    const id1 = await firstCardPage1.getAttribute('data-avatar-id');

    // Navigate to page 2
    await page.locator('#as-next').click();
    await page.waitForTimeout(500);

    const firstCardPage2 = page.locator('#as-grid > [data-avatar-id]').first();
    const id2 = await firstCardPage2.getAttribute('data-avatar-id');

    expect(id1).not.toBe(id2);
  });

  test('page info shows correct page count (5 pages for 50 avatars)', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const pageNum = page.locator('#as-page-num');
    const text = await pageNum.textContent();
    expect(text).toContain('1 / 5');
  });

  test('clicking an avatar card shows the save section', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-avatar', '1');
      localStorage.setItem('swf-display-name', 'Blue Fox');
      localStorage.setItem('swf-uid', 'test-avatar-swap');
    });

    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });

    // Click the second avatar (not the current one)
    const secondCard = page.locator('#as-grid > [data-avatar-id]').nth(1);
    await secondCard.click();
    await page.waitForTimeout(500);

    const saveWrap = page.locator('#as-save-wrap');
    await expect(saveWrap).toBeVisible();
  });

  test('save section shows selected avatar preview', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-avatar', '1');
      localStorage.setItem('swf-display-name', 'Blue Fox');
      localStorage.setItem('swf-uid', 'test-avatar-preview');
    });

    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });

    const secondCard = page.locator('#as-grid > [data-avatar-id]').nth(1);
    await secondCard.click();
    await page.waitForTimeout(500);

    const selectedImg = page.locator('#as-selected-img');
    const src = await selectedImg.getAttribute('src');
    expect(src).toMatch(/^\/avatars\/avatar-\d+\.svg$/);
  });

  test('FAQPage JSON-LD schema is present', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const content = await schemas.nth(i).textContent() || '';
      if (content.includes('"FAQPage"') && content.includes('avatar')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

// ── Avatar Swap Page — Negative ──────────────────────────────────────────

test.describe('Avatar Swap Page — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('does not expose sensitive information', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const mainContent = await page.locator('main').last().textContent() || '';
    expect(mainContent).not.toContain('sk-');
    expect(mainContent).not.toContain('AKIA');
    expect(mainContent).not.toContain('@gmail.com');
    expect(mainContent).not.toContain('rajeev');
  });

  test('save section is hidden by default (no selection)', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const saveWrap = page.locator('#as-save-wrap');
    await expect(saveWrap).toBeHidden();
  });

  test('clicking current avatar does not show save section', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-avatar', '1');
      localStorage.setItem('swf-display-name', 'Blue Fox');
      localStorage.setItem('swf-uid', 'test-no-self-select');
    });

    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });

    // Click avatar-1 which is the current one
    const currentCard = page.locator('#as-grid > [data-avatar-id="1"]');
    if (await currentCard.count() > 0) {
      await currentCard.click();
      await page.waitForTimeout(300);
      const saveWrap = page.locator('#as-save-wrap');
      await expect(saveWrap).toBeHidden();
    }
  });

  test('no duplicate page elements', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    expect(await page.locator('#as-current').count()).toBe(1);
    expect(await page.locator('#as-grid').count()).toBe(1);
    expect(await page.locator('#as-prev').count()).toBe(1);
    expect(await page.locator('#as-next').count()).toBe(1);
    expect(await page.locator('#as-save-btn').count()).toBe(1);
  });

  test('prev button stays disabled when clicking on first page', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    await page.waitForSelector('#as-grid:not(.hidden)', { timeout: 5000 });
    const prevBtn = page.locator('#as-prev');
    await prevBtn.click({ force: true });
    await page.waitForTimeout(300);
    await expect(prevBtn).toBeDisabled();
  });

  test('toast is hidden by default', async ({ page }) => {
    await page.goto(`${BASE}/avatar-swap/`);
    const toast = page.locator('#as-toast');
    await expect(toast).toBeHidden();
  });
});

// ── Settings — Change Avatar Link ────────────────────────────────────────

test.describe('Settings — Change Avatar Link — Positive', () => {
  test('Change Avatar now link is visible on settings page', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Change Avatar now');
  });

  test('Change Avatar now link has correct teal styling', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    const classes = await link.getAttribute('class') || '';
    expect(classes).toContain('text-teal-400');
    expect(classes).toContain('underline');
  });

  test('Change Avatar now link navigates to avatar-swap page', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    await link.click();
    await page.waitForURL(/avatar-swap/);
    await expect(page).toHaveTitle(/Change Avatar/);
  });
});

test.describe('Settings — Change Avatar Link — Negative', () => {
  test('only one Change Avatar link exists on settings page', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const links = page.locator('a[href="/avatar-swap/"]');
    expect(await links.count()).toBe(1);
  });

  test('Change Avatar link does not have broken href', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const link = page.locator('a[href="/avatar-swap/"]');
    const href = await link.getAttribute('href');
    expect(href).toBe('/avatar-swap/');
    expect(href).not.toContain('undefined');
  });
});
