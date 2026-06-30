import { test, expect } from '@playwright/test';

/**
 * Diamond Hunt Page + StarBar Button Tests
 * Covers the Diamond Hunt button on the StarBar and the /diamond-hunt/ page.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const TEST_UID = 'test-dh-page-playwright';

// ── Diamond Hunt StarBar Button — Positive ──────────────────────────────────

test.describe('Diamond Hunt StarBar Button — Positive', () => {
  test('Diamond Hunt button is visible on activities page', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const btn = page.locator('#sb-diamond-hunt-link');
    await expect(btn).toBeVisible();
  });

  test('Diamond Hunt button links to /diamond-hunt/', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const btn = page.locator('#sb-diamond-hunt-link');
    await expect(btn).toHaveAttribute('href', '/diamond-hunt/');
  });

  test('Diamond Hunt button has diamond icon and label text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${BASE}/activities/`);
    const btn = page.locator('#sb-diamond-hunt-link');
    const text = await btn.textContent();
    expect(text).toContain('💎');
    expect(text).toContain('Diamond Hunt');
  });

  test('Diamond Hunt button navigates to the diamond hunt page on click', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    await page.locator('#sb-diamond-hunt-link').click();
    await page.waitForURL('**/diamond-hunt/**');
    expect(page.url()).toContain('/diamond-hunt/');
  });
});

// ── Diamond Hunt StarBar Button — Negative ──────────────────────────────────

test.describe('Diamond Hunt StarBar Button — Negative', () => {
  test('no duplicate Diamond Hunt buttons on star bar', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const links = page.locator('#sb-diamond-hunt-link');
    await expect(links).toHaveCount(1);
  });

  test('Diamond Hunt button does not break star bar layout', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/activities/`);
    await page.waitForLoadState('networkidle');
    // Star bar should still be visible
    await expect(page.locator('#star-bar')).toBeVisible();
    // MyBag link should still exist next to Diamond Hunt
    await expect(page.locator('#sb-mybag-link')).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});

// ── Diamond Hunt Page — Positive ────────────────────────────────────────────

test.describe('Diamond Hunt Page — Positive', () => {
  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE}/diamond-hunt/`);
    expect(response?.status()).toBe(200);
  });

  test('page has correct title and heading', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await expect(page.locator('h1')).toContainText('Diamond Hunt');
    const title = await page.title();
    expect(title).toContain('Diamond Hunt');
  });

  test('page shows stats cards when user has UID', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    // Mock APIs
    await page.route('**/api/diamond-hunt/**', (route, request) => {
      if (request.url().includes('diamond-hunt-user')) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [
            { id: 1, dom_loc: '/activities/', diamonds_per_claim: 1, diamonds_remaining: 19, status: 'active', claim_count: 1 },
            { id: 2, dom_loc: '/mybag/', diamonds_per_claim: 1, diamonds_remaining: 14, status: 'active', claim_count: 0 },
          ],
          summary: { total: 2, active: 2, inactive: 0, totalClaims: 1 },
        }),
      });
    });

    await page.route('**/api/diamond-hunt-user/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          claims: [{ diamond_id: 1, diamonds_earned: 1, claimed_at: new Date().toISOString() }],
          today_claims: [{ diamond_id: 1, diamonds_earned: 1, claimed_at: new Date().toISOString() }],
          total_earned: 1,
        }),
      });
    });

    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForSelector('#dh-content:not(.hidden)', { timeout: 5000 });

    // Stats should be visible
    await expect(page.locator('#dh-total-mines')).toBeVisible();
    await expect(page.locator('#dh-claimed-count')).toBeVisible();
    await expect(page.locator('#dh-diamonds-earned')).toBeVisible();
    await expect(page.locator('#dh-unclaimed')).toBeVisible();
  });

  test('mine list renders with links to pages', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt/**', (route, request) => {
      if (request.url().includes('diamond-hunt-user')) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [
            { id: 1, dom_loc: '/activities/', diamonds_per_claim: 1, diamonds_remaining: 19, status: 'active', claim_count: 1 },
            { id: 6, dom_loc: '/', diamonds_per_claim: 3, diamonds_remaining: 30, status: 'active', claim_count: 0 },
          ],
          summary: { total: 2, active: 2, inactive: 0, totalClaims: 1 },
        }),
      });
    });

    await page.route('**/api/diamond-hunt-user/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ claims: [], today_claims: [], total_earned: 0 }),
      });
    });

    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForSelector('#dh-mine-list a', { timeout: 5000 });

    const mineLinks = page.locator('#dh-mine-list a');
    const count = await mineLinks.count();
    expect(count).toBe(2);

    // Links should have correct hrefs
    await expect(mineLinks.first()).toHaveAttribute('href', '/activities/');
  });

  test('claimed mines show claimed badge, unclaimed show available', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt/**', (route, request) => {
      if (request.url().includes('diamond-hunt-user')) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [
            { id: 1, dom_loc: '/activities/', diamonds_per_claim: 1, diamonds_remaining: 19, status: 'active', claim_count: 1 },
            { id: 2, dom_loc: '/mybag/', diamonds_per_claim: 1, diamonds_remaining: 14, status: 'active', claim_count: 0 },
          ],
          summary: { total: 2, active: 2, inactive: 0, totalClaims: 1 },
        }),
      });
    });

    await page.route('**/api/diamond-hunt-user/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          claims: [{ diamond_id: 1, diamonds_earned: 1, claimed_at: new Date().toISOString() }],
          today_claims: [],
          total_earned: 1,
        }),
      });
    });

    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForSelector('#dh-mine-list a', { timeout: 5000 });

    const mineCards = page.locator('#dh-mine-list a');
    const firstText = await mineCards.nth(0).textContent();
    const secondText = await mineCards.nth(1).textContent();
    expect(firstText).toContain('Claimed');
    expect(secondText).toContain('Available');
  });

  test('FAQPage schema is present', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const content = await schema.textContent();
    expect(content).toContain('FAQPage');
    expect(content).toContain('Diamond Hunt');
  });

  test('activities link is visible for navigation back', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    const activitiesLink = page.locator('a[href="/activities/"]');
    await expect(activitiesLink.first()).toBeVisible();
  });
});

// ── Diamond Hunt Page — Negative ────────────────────────────────────────────

test.describe('Diamond Hunt Page — Negative', () => {
  test('shows no-user message when UID is not set', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForTimeout(1500);

    const noUser = page.locator('#dh-no-user');
    await expect(noUser).toBeVisible();
  });

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('handles API failure gracefully', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt/**', route => route.abort('connectionrefused'));
    await page.route('**/api/diamond-hunt-user/**', route => route.abort('connectionrefused'));

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForTimeout(3000);

    // Should not crash
    expect(errors).toHaveLength(0);
    // Should show error message in mine list
    const errorMsg = page.locator('#dh-mine-list');
    const text = await errorMsg.textContent();
    expect(text).toContain('Unable to load');
  });

  test('stat cards show 0 values when no data exists', async ({ page }) => {
    await page.goto(`${BASE}/diamond-hunt/`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt/**', (route, request) => {
      if (request.url().includes('diamond-hunt-user')) return route.continue();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ diamonds: [], summary: { total: 0, active: 0, inactive: 0, totalClaims: 0 } }),
      });
    });

    await page.route('**/api/diamond-hunt-user/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ claims: [], today_claims: [], total_earned: 0 }),
      });
    });

    await page.goto(`${BASE}/diamond-hunt/`);
    await page.waitForSelector('#dh-content:not(.hidden)', { timeout: 5000 });

    await expect(page.locator('#dh-total-mines')).toHaveText('0');
    await expect(page.locator('#dh-claimed-count')).toHaveText('0');
    await expect(page.locator('#dh-diamonds-earned')).toHaveText('0');
    await expect(page.locator('#dh-unclaimed')).toHaveText('0');
  });
});
