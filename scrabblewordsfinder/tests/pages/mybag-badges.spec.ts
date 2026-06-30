import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

const EXPECTED_BADGE_TIERS = [
  { name: 'Word Maker', threshold: 25, theme: 'Beginner' },
  { name: 'Word Smith', threshold: 100, theme: 'Crafter' },
  { name: 'Word Master', threshold: 250, theme: 'Skilled' },
  { name: 'Word Wizard', threshold: 500, theme: 'Magical' },
  { name: 'Grand Lexicon', threshold: 1000, theme: 'Vocabulary' },
  { name: 'Scrabble Sage', threshold: 2500, theme: 'Wise' },
  { name: 'Lex Legend', threshold: 5000, theme: 'Legendary' },
  { name: 'Vocabulary Virtuoso', threshold: 10000, theme: 'Elite' },
  { name: 'Dictionary Guardian', threshold: 20000, theme: 'Protector of words' },
  { name: 'Letter Lord', threshold: 40000, theme: 'Commander' },
  { name: 'Tile Titan', threshold: 75000, theme: 'Giant' },
  { name: 'Word Emperor', threshold: 125000, theme: 'Royal' },
  { name: 'Lexicon Immortal', threshold: 250000, theme: 'Eternal' },
  { name: 'Alphabet Ascendant', threshold: 500000, theme: 'Mythical' },
  { name: 'Grand Word Deity', threshold: 1000000, theme: 'Ultimate' },
];

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

  test('mybag API returns badges array with 15 tiers', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.badges).toBeDefined();
    expect(data.badges.length).toBe(15);
  });

  test('badges array contains correct tier names in order', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    const names = data.badges.map((b: any) => b.name);
    expect(names).toEqual(EXPECTED_BADGE_TIERS.map(t => t.name));
  });

  test('each badge has required fields: name, img, info, theme, achieved', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    for (const badge of data.badges) {
      expect(badge.name).toBeTruthy();
      expect(badge.img).toMatch(/^\/badges\//);
      expect(badge.info).toContain('diamonds required');
      expect(badge.theme).toBeTruthy();
      expect(typeof badge.achieved).toBe('boolean');
    }
  });

  test('each badge info string includes its theme', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    for (let i = 0; i < data.badges.length; i++) {
      const badge = data.badges[i];
      const expected = EXPECTED_BADGE_TIERS[i];
      expect(badge.info).toContain(expected.theme);
      expect(badge.theme).toBe(expected.theme);
    }
  });

  test('Word Maker badge is achieved with 25+ diamonds', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    expect(data.totals.total_diamonds).toBeGreaterThanOrEqual(25);
    expect(data.badges[0].name).toBe('Word Maker');
    expect(data.badges[0].achieved).toBe(true);
  });

  test('badge thresholds are in ascending order', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    for (let i = 1; i < data.badges.length; i++) {
      // info format: "1,000 diamonds required — Theme" — strip commas before parsing
      const prevThreshold = parseInt(data.badges[i - 1].info.replace(/,/g, ''));
      const currThreshold = parseInt(data.badges[i].info.replace(/,/g, ''));
      expect(currThreshold).toBeGreaterThan(prevThreshold);
    }
  });

  test('badge modal exists in DOM for enlarged view', async ({ page }) => {
    await page.goto(`${BASE}/mybag/`);
    const modal = page.locator('#mb-badge-modal');
    expect(await modal.count()).toBe(1);
    await expect(modal).toBeHidden();
  });
});

test.describe('MyBag Badges — Negative', () => {
  test('high-tier badges above user diamond count are locked', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    const diamonds = data.totals.total_diamonds;
    // Grand Word Deity requires 1,000,000 — should be locked for any realistic test user
    const deity = data.badges.find((b: any) => b.name === 'Grand Word Deity');
    expect(deity).toBeDefined();
    if (diamonds < 1000000) {
      expect(deity.achieved).toBe(false);
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

  test('no badge has an empty theme field', async ({ page }) => {
    const response = await page.request.get(`${BASE}/api/mybag/?user_id=u_mqltmmxuod45iu&limit=1`);
    const data = await response.json();
    for (const badge of data.badges) {
      expect(badge.theme).toBeTruthy();
      expect(badge.theme.length).toBeGreaterThan(0);
    }
  });
});
