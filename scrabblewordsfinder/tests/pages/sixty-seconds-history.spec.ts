import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE = `${BASE_URL}/sixty-seconds/`;

// Helper: seed localStorage with round history data
const MOCK_HISTORY = [
  {
    round_id: 'test-round-1',
    created_at: '2026-06-18T10:00:00.000Z',
    words: [
      { word: 'CAT', points: 5, attempt: 1, split_time: 55 },
      { word: 'TACK', points: 10, attempt: 2, split_time: 42 },
      { word: 'ACE', points: 5, attempt: 3, split_time: 30 },
    ],
    total: 20,
  },
  {
    round_id: 'test-round-2',
    created_at: '2026-06-17T09:00:00.000Z',
    words: [
      { word: 'DOG', points: 5, attempt: 1, split_time: 50 },
    ],
    total: 5,
  },
];

// ── History Feature — Positive ──────────────────────────────────────────────

test.describe('60-Second History — Positive', () => {
  test('history button is visible when localStorage has round data', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    const btn = page.locator('#history-btn');
    await expect(btn).toBeVisible();
  });

  test('clicking history button opens history panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await expect(page.locator('#history-panel')).toBeVisible();
  });

  test('history panel shows correct number of rounds', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    const rounds = page.locator('#history-list > div');
    await expect(rounds).toHaveCount(2);
  });

  test('history panel shows total points per round', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await expect(page.locator('#history-list')).toContainText('20 pts');
    await expect(page.locator('#history-list')).toContainText('5 pts');
  });

  test('history panel shows word pills with split times', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await expect(page.locator('#history-list')).toContainText('CAT');
    await expect(page.locator('#history-list')).toContainText('@55s');
    await expect(page.locator('#history-list')).toContainText('@42s');
  });

  test('close button hides history panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await expect(page.locator('#history-panel')).toBeVisible();
    await page.click('#history-close');
    await expect(page.locator('#history-panel')).toBeHidden();
  });
});

// ── History Feature — Negative ──────────────────────────────────────────────

test.describe('60-Second History — Negative', () => {
  test('history button is hidden when no rounds exist', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.removeItem('swf-60s-history');
    });
    await page.reload();
    await expect(page.locator('#history-btn')).toBeHidden();
  });

  test('history panel shows empty state when data is cleared', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    // Clear and try to open
    await page.evaluate(() => {
      localStorage.setItem('swf-60s-history', '[]');
    });
    // Force the button visible to test the empty state rendering
    await page.evaluate(() => {
      document.getElementById('history-btn')?.classList.remove('hidden');
    });
    await page.click('#history-btn');
    await expect(page.locator('#history-empty')).toBeVisible();
  });

  test('no duplicate history-btn elements', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#history-btn')).toHaveCount(1);
  });

  test('no JavaScript errors on page load with history data', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('history handles corrupted localStorage gracefully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.setItem('swf-60s-history', 'not-valid-json{{{');
    });
    await page.reload();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
    // Button should be hidden (no valid data)
    await expect(page.locator('#history-btn')).toBeHidden();
  });
});

// ── Inspect Timeline — Positive ─────────────────────────────────────────────

test.describe('60-Second Inspect Timeline — Positive', () => {
  test('inspect button exists in history panel for each round', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    const inspectBtns = page.locator('.inspect-round-btn');
    await expect(inspectBtns).toHaveCount(2);
  });

  test('clicking inspect opens the timeline panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await page.click('.inspect-round-btn >> nth=0');
    await expect(page.locator('#inspect-panel')).toBeVisible();
  });

  test('inspect timeline shows word count and total points', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await page.click('.inspect-round-btn >> nth=0');
    await expect(page.locator('#inspect-content')).toContainText('3 words');
    await expect(page.locator('#inspect-content')).toContainText('20 pts total');
  });

  test('inspect timeline shows word pills with purple borders', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await page.click('.inspect-round-btn >> nth=0');
    // Check for words in the timeline
    await expect(page.locator('#inspect-content')).toContainText('CAT');
    await expect(page.locator('#inspect-content')).toContainText('TACK');
    await expect(page.locator('#inspect-content')).toContainText('ACE');
    // Verify purple border styling exists
    const pills = page.locator('#inspect-content span.border-purple-500');
    await expect(pills).toHaveCount(3);
  });

  test('inspect close button hides the panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await page.click('.inspect-round-btn >> nth=0');
    await expect(page.locator('#inspect-panel')).toBeVisible();
    await page.click('#inspect-close');
    await expect(page.locator('#inspect-panel')).toBeHidden();
  });
});

// ── Inspect Timeline — Negative ─────────────────────────────────────────────

test.describe('60-Second Inspect Timeline — Negative', () => {
  test('inspect panel is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#inspect-panel')).toBeHidden();
  });

  test('no duplicate inspect-panel elements', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#inspect-panel')).toHaveCount(1);
  });

  test('opening inspect hides history panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate((data) => {
      localStorage.setItem('swf-60s-history', JSON.stringify(data));
    }, MOCK_HISTORY);
    await page.reload();
    await page.click('#history-btn');
    await expect(page.locator('#history-panel')).toBeVisible();
    await page.click('.inspect-round-btn >> nth=0');
    await expect(page.locator('#history-panel')).toBeHidden();
    await expect(page.locator('#inspect-panel')).toBeVisible();
  });
});
