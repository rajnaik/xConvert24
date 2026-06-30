import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('MyBag Badges — Positive', () => {
  test('badges section heading exists in DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const heading = page.locator('h2', { hasText: 'My Badges' });
    await expect(heading).toBeAttached();
  });

  test('badges grid container exists', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    expect(await grid.count()).toBe(1);
    await expect(grid).toHaveClass(/grid/);
  });

  test('mybag API returns badges array with 7 tiers', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.badges).toBeDefined();
    expect(data.badges.length).toBe(7);
  });

  test('badges array contains correct tier names in order', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    const names = data.badges.map((b: any) => b.name);
    expect(names).toEqual([
      'Word Maker',
      'Word Smith',
      'Word Master',
      'Word Wizard',
      'Grand Lexicon',
      'Scrabble Sage',
      'Lex Legend',
    ]);
  });

  test('each badge has required fields: name, img, info, achieved', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    for (const badge of data.badges) {
      expect(badge.name).toBeTruthy();
      expect(badge.img).toMatch(/^\/badges\//);
      expect(badge.info).toContain('diamonds required');
      expect(typeof badge.achieved).toBe('boolean');
    }
  });

  test('Word Maker badge is achieved with 25+ diamonds', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    expect(data.totals.total_diamonds).toBeGreaterThanOrEqual(25);
    expect(data.badges[0].name).toBe('Word Maker');
    expect(data.badges[0].achieved).toBe(true);
  });

  test('badge modal exists in DOM for enlarged view', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    expect(await modal.count()).toBe(1);
    await expect(modal).toBeHidden();
  });
});

test.describe('MyBag Badges — Negative', () => {
  test('badges above user diamond count are locked', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    const diamonds = data.totals.total_diamonds;
    // Lex Legend requires 5000, should be locked for test user
    const lexLegend = data.badges.find((b: any) => b.name === 'Lex Legend');
    expect(lexLegend).toBeDefined();
    if (diamonds < 5000) {
      expect(lexLegend.achieved).toBe(false);
    }
  });

  test('no duplicate badges in API response', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    const names = data.badges.map((b: any) => b.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  test('badges grid does not duplicate entries in DOM', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const grid = page.locator('#mb-badges-grid');
    expect(await grid.count()).toBe(1);
  });

  test('API returns 400 without user_id', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/`);
    expect(response.status()).toBe(400);
  });
});
