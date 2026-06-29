import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ── Diamond Hunt Slots on New Pages — Positive ───────────────────────────

test.describe('Diamond Hunt Slots — New Pages (Positive)', () => {

  test('quiz-history page has diamond-hunt-slot with data-diamond-id="4"', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz-history/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="4"]');
    await expect(slot).toBeAttached();
  });

  test('guide page has diamond-hunt-slot with data-diamond-id="5"', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="5"]');
    await expect(slot).toBeAttached();
  });

  test('quiz-history slot has correct accessibility attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz-history/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="4"]');
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
    await expect(slot).toHaveAttribute('aria-label', 'Claim a hidden diamond');
  });

  test('guide slot has correct accessibility attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="5"]');
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
    await expect(slot).toHaveAttribute('aria-label', 'Claim a hidden diamond');
  });

  test('mybag page slot uses data-diamond-id="2"', async ({ page }) => {
    await page.goto(`${BASE_URL}/mybag/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="2"]');
    await expect(slot).toBeAttached();
  });

  test('homepage has diamond-hunt-slot with data-diamond-id="6"', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="6"]');
    await expect(slot).toBeAttached();
  });

  test('homepage slot has correct accessibility attributes', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const slot = page.locator('.diamond-hunt-slot[data-diamond-id="6"]');
    await expect(slot).toHaveAttribute('role', 'button');
    await expect(slot).toHaveAttribute('tabindex', '0');
    await expect(slot).toHaveAttribute('aria-label', 'Claim a hidden diamond');
  });

  test('all 6 pages have unique diamond IDs (no ID reuse)', async ({ page }) => {
    const pages = [
      { url: '/activities/', expectedId: '1' },
      { url: '/mybag/', expectedId: '2' },
      { url: '/blog/roadmap-to-being-a-pro-player/', expectedId: '3' },
      { url: '/quiz-history/', expectedId: '4' },
      { url: '/guide/', expectedId: '5' },
      { url: '/', expectedId: '6' },
    ];
    for (const p of pages) {
      await page.goto(`${BASE_URL}${p.url}`);
      const slot = page.locator(`.diamond-hunt-slot[data-diamond-id="${p.expectedId}"]`);
      await expect(slot).toBeAttached();
    }
  });
});

// ── Diamond Hunt Slots on New Pages — Negative ───────────────────────────

test.describe('Diamond Hunt Slots — New Pages (Negative)', () => {

  test('homepage has exactly 1 diamond-hunt-slot (no duplicates)', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const count = await page.locator('.diamond-hunt-slot').count();
    expect(count).toBe(1);
  });

  test('homepage slot is hidden by default before API reveals it', async ({ page }) => {
    await page.route('**/api/diamond-hunt/**', route => route.abort());
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(500);
    const slot = page.locator('.diamond-hunt-slot').first();
    await expect(slot).toHaveClass(/hidden/);
  });

  test('no JS errors on homepage from diamond hunt slot', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1500);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(critical).toHaveLength(0);
  });

  test('quiz-history has exactly 1 diamond-hunt-slot (no duplicates)', async ({ page }) => {
    await page.goto(`${BASE_URL}/quiz-history/`);
    const count = await page.locator('.diamond-hunt-slot').count();
    expect(count).toBe(1);
  });

  test('guide has exactly 1 diamond-hunt-slot (no duplicates)', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide/`);
    const count = await page.locator('.diamond-hunt-slot').count();
    expect(count).toBe(1);
  });

  test('quiz-history slot is hidden by default before API reveals it', async ({ page }) => {
    // Block the diamond-hunt API to prevent the script from revealing the slot
    await page.route('**/api/diamond-hunt/**', route => route.abort());
    await page.goto(`${BASE_URL}/quiz-history/`);
    await page.waitForTimeout(500);
    const slot = page.locator('.diamond-hunt-slot').first();
    await expect(slot).toHaveClass(/hidden/);
  });

  test('guide slot is hidden by default before API reveals it', async ({ page }) => {
    // Block the diamond-hunt API to prevent the script from revealing the slot
    await page.route('**/api/diamond-hunt/**', route => route.abort());
    await page.goto(`${BASE_URL}/guide/`);
    await page.waitForTimeout(500);
    const slot = page.locator('.diamond-hunt-slot').first();
    await expect(slot).toHaveClass(/hidden/);
  });

  test('no JS errors on quiz-history page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/quiz-history/`);
    await page.waitForTimeout(1500);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(critical).toHaveLength(0);
  });

  test('no JS errors on guide page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/guide/`);
    await page.waitForTimeout(1500);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(critical).toHaveLength(0);
  });
});

// ── Diamond Leaderboard — Positive ───────────────────────────────────────

test.describe('Diamond Leaderboard — Positive', () => {

  test('leaderboard API returns 200 with leaderboard array', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/diamond-leaderboard/?user_id=test-user`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.leaderboard).toBeDefined();
    expect(Array.isArray(body.leaderboard)).toBe(true);
  });

  test('leaderboard API returns ranked entries with expected fields', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/diamond-leaderboard/?user_id=test-user`);
    const body = await response.json();
    if (body.leaderboard.length > 0) {
      const first = body.leaderboard[0];
      expect(first).toHaveProperty('rank');
      expect(first).toHaveProperty('user_id_short');
      expect(first).toHaveProperty('is_you');
      expect(first).toHaveProperty('total_diamonds');
      expect(first).toHaveProperty('total_stars');
      expect(first).toHaveProperty('best_streak');
      expect(first.rank).toBe(1);
    }
  });

  test('leaderboard API returns user_rank and user_total', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/diamond-leaderboard/?user_id=test-user`);
    const body = await response.json();
    expect(body).toHaveProperty('user_rank');
    expect(body).toHaveProperty('user_total');
  });

  test('mybag page contains leaderboard section', async ({ page }) => {
    await page.goto(`${BASE_URL}/mybag/`);
    const section = page.locator('#mb-leaderboard-section');
    await expect(section).toBeAttached();
  });

  test('leaderboard table has correct column headers', async ({ page }) => {
    await page.goto(`${BASE_URL}/mybag/`);
    const headers = page.locator('#mb-leaderboard-section thead th');
    await expect(headers).toHaveCount(5);
  });
});

// ── Diamond Leaderboard — Negative ───────────────────────────────────────

test.describe('Diamond Leaderboard — Negative', () => {

  test('leaderboard API handles missing user_id gracefully', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/diamond-leaderboard/`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Should still return leaderboard, just user_rank may be null
    expect(body.leaderboard).toBeDefined();
    expect(body.user_rank).toBeNull();
  });

  test('no duplicate leaderboard sections on mybag page', async ({ page }) => {
    await page.goto(`${BASE_URL}/mybag/`);
    const sections = page.locator('#mb-leaderboard-section');
    await expect(sections).toHaveCount(1);
  });

  test('leaderboard does not expose full user IDs (privacy)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/diamond-leaderboard/?user_id=x`);
    const body = await response.json();
    for (const entry of body.leaderboard) {
      // user_id_short should be truncated (max 9 chars: 6 + "...")
      expect(entry.user_id_short.length).toBeLessThanOrEqual(9);
      expect(entry.user_id_short).toContain('...');
    }
  });
});

// ── Celebration Animation — Positive ─────────────────────────────────────

test.describe('Diamond Celebration Animation — Positive', () => {

  test('celebration CSS keyframes are injected on pages with slots', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    // Wait for the diamond hunt script to run
    await page.waitForTimeout(2000);
    const hasCss = await page.evaluate(() => {
      return !!document.getElementById('dh-celebration-css');
    });
    expect(hasCss).toBe(true);
  });

  test('celebration CSS contains all required keyframe names', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    await page.waitForTimeout(2000);
    const cssContent = await page.evaluate(() => {
      const el = document.getElementById('dh-celebration-css');
      return el ? el.textContent : '';
    });
    expect(cssContent).toContain('dhFadeIn');
    expect(cssContent).toContain('dhFadeOut');
    expect(cssContent).toContain('dhPopIn');
    expect(cssContent).toContain('dhSpin');
    expect(cssContent).toContain('dhBurst');
    expect(cssContent).toContain('dhConfetti');
  });

  test('showDiamondCelebration function is defined in page script', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    const content = await page.content();
    expect(content).toContain('showDiamondCelebration');
  });
});

// ── Celebration Animation — Negative ─────────────────────────────────────

test.describe('Diamond Celebration Animation — Negative', () => {

  test('celebration overlay does not exist on page load (no premature trigger)', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    await page.waitForTimeout(2000);
    const overlay = page.locator('#diamond-celebration');
    await expect(overlay).toHaveCount(0);
  });

  test('celebration CSS is only injected once (no duplicates)', async ({ page }) => {
    await page.goto(`${BASE_URL}/activities/`);
    await page.waitForTimeout(2000);
    const count = await page.evaluate(() => {
      return document.querySelectorAll('#dh-celebration-css').length;
    });
    expect(count).toBeLessThanOrEqual(1);
  });
});
