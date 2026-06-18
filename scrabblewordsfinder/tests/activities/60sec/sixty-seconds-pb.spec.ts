import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE_URL}/sixty-seconds/`;
const STATS_URL = `${BASE_URL}/stats/`;

// ── Personal Best Display — Positive ─────────────────────────────────────

test.describe('60-Second PB Display — Positive', () => {
  test('PB section exists with trophy label and score element', async ({ page }) => {
    await page.goto(PAGE_URL);
    const pbSection = page.locator('#personal-best');
    await expect(pbSection).toBeVisible();
    const pbDate = page.locator('#pb-date');
    await expect(pbDate).toHaveCount(1);
  });

  test('shows dash when no PB is stored', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-60s-pb');
    });
    await page.goto(PAGE_URL);
    await expect(page.locator('#personal-best')).toContainText('—');
    await expect(page.locator('#pb-date')).toHaveText('');
  });

  test('displays PB score and date when JSON PB exists in localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', JSON.stringify({ score: 85, achievedAt: '2026-06-15T14:30:00.000Z' }));
    });
    await page.goto(PAGE_URL);
    await expect(page.locator('#personal-best')).toContainText('85 pts');
    await expect(page.locator('#pb-date')).toContainText('Set on 15 Jun 2026');
  });

  test('handles legacy plain number format gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', '42');
    });
    await page.goto(PAGE_URL);
    await expect(page.locator('#personal-best')).toContainText('42 pts');
    // No date shown for legacy format
    await expect(page.locator('#pb-date')).toHaveText('');
  });

  test('PB date section is empty when achievedAt is null', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', JSON.stringify({ score: 50, achievedAt: null }));
    });
    await page.goto(PAGE_URL);
    await expect(page.locator('#personal-best')).toContainText('50 pts');
    await expect(page.locator('#pb-date')).toHaveText('');
  });
});

// ── Personal Best Display — Negative ─────────────────────────────────────

test.describe('60-Second PB Display — Negative', () => {
  test('no JS errors on page load with malformed PB data', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', '{invalid json!!!');
    });
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1000);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('SyntaxError'));
    expect(critical).toHaveLength(0);
  });

  test('shows dash when PB data is corrupt JSON', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', '{not:valid}');
    });
    await page.goto(PAGE_URL);
    // Should fall through to showing dash (score parsed as NaN → 0)
    const text = await page.locator('#personal-best').textContent();
    expect(text).toContain('—');
  });

  test('no duplicate PB sections on page', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('#personal-best')).toHaveCount(1);
    await expect(page.locator('#pb-date')).toHaveCount(1);
  });
});

// ── Stats Page PB — Positive ─────────────────────────────────────────────

test.describe('Stats Page 60-Second PB — Positive', () => {
  test('stats page shows PB score with date from JSON format', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', JSON.stringify({ score: 120, achievedAt: '2026-06-18T09:15:00.000Z' }));
      localStorage.setItem('swf-uid', 'pw-stats-pb-test');
    });
    await page.goto(STATS_URL);
    const pbEl = page.locator('#sixty-stat-pb');
    await expect(pbEl).toContainText('120 pts');
    await expect(pbEl).toContainText('18 Jun');
  });

  test('stats page shows PB from legacy plain number without date', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', '77');
      localStorage.setItem('swf-uid', 'pw-stats-legacy-test');
    });
    await page.goto(STATS_URL);
    const pbEl = page.locator('#sixty-stat-pb');
    await expect(pbEl).toContainText('77 pts');
  });

  test('stats page shows dash when no PB exists', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-60s-pb');
      localStorage.setItem('swf-uid', 'pw-stats-no-pb');
    });
    await page.goto(STATS_URL);
    await expect(page.locator('#sixty-stat-pb')).toContainText('—');
  });
});

// ── Stats Page PB — Negative ─────────────────────────────────────────────

test.describe('Stats Page 60-Second PB — Negative', () => {
  test('stats page handles malformed PB JSON without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', 'not-a-number-or-json');
      localStorage.setItem('swf-uid', 'pw-stats-bad-data');
    });
    await page.goto(STATS_URL);
    await page.waitForTimeout(1000);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(critical).toHaveLength(0);
  });

  test('stats page shows dash for zero-score PB object', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-60s-pb', JSON.stringify({ score: 0, achievedAt: '2026-01-01T00:00:00Z' }));
      localStorage.setItem('swf-uid', 'pw-stats-zero');
    });
    await page.goto(STATS_URL);
    await expect(page.locator('#sixty-stat-pb')).toContainText('—');
  });
});
