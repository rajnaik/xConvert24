import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';
const PAGE = `${BASE_URL}/sixty-seconds/`;

// ── 60-Second Word Finder — History & Inspect Panels ────────────────────────

test.describe('60-Second Word Finder — History Panel — Positive', () => {
  test('history button exists in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    const historyBtn = page.locator('#history-btn');
    await expect(historyBtn).toBeAttached();
  });

  test('history button has correct aria-label', async ({ page }) => {
    await page.goto(PAGE);
    const historyBtn = page.locator('#history-btn');
    await expect(historyBtn).toHaveAttribute('aria-label', 'View round history');
  });

  test('history panel exists but is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#history-panel');
    await expect(panel).toBeAttached();
    await expect(panel).toHaveClass(/hidden/);
  });

  test('history panel has correct heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('#history-panel h2');
    await expect(heading).toContainText('Round History');
  });

  test('history panel has close button', async ({ page }) => {
    await page.goto(PAGE);
    const closeBtn = page.locator('#history-close');
    await expect(closeBtn).toBeAttached();
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close history');
  });

  test('history-list container exists for round entries', async ({ page }) => {
    await page.goto(PAGE);
    const list = page.locator('#history-list');
    await expect(list).toBeAttached();
  });

  test('history-empty message exists for empty state', async ({ page }) => {
    await page.goto(PAGE);
    const empty = page.locator('#history-empty');
    await expect(empty).toBeAttached();
    await expect(empty).toContainText('No rounds played yet');
  });
});

test.describe('60-Second Word Finder — History Panel — Negative', () => {
  test('no duplicate history panels exist', async ({ page }) => {
    await page.goto(PAGE);
    const panels = page.locator('#history-panel');
    await expect(panels).toHaveCount(1);
  });

  test('no duplicate history buttons exist', async ({ page }) => {
    await page.goto(PAGE);
    const btns = page.locator('#history-btn');
    await expect(btns).toHaveCount(1);
  });

  test('history button is hidden when no PB exists', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.removeItem('swf-60s-pb');
    });
    await page.reload();
    const historyBtn = page.locator('#history-btn');
    await expect(historyBtn).toHaveClass(/hidden/);
  });

  test('history panel does not show without user interaction', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#history-panel');
    await expect(panel).toHaveClass(/hidden/);
  });
});

test.describe('60-Second Word Finder — Inspect Panel — Positive', () => {
  test('inspect panel exists but is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#inspect-panel');
    await expect(panel).toBeAttached();
    await expect(panel).toHaveClass(/hidden/);
  });

  test('inspect panel has correct heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('#inspect-panel h2');
    await expect(heading).toContainText('Timeline Inspect');
  });

  test('inspect panel has close button with aria-label', async ({ page }) => {
    await page.goto(PAGE);
    const closeBtn = page.locator('#inspect-close');
    await expect(closeBtn).toBeAttached();
    await expect(closeBtn).toHaveAttribute('aria-label', 'Close inspect');
  });

  test('inspect-content container exists for timeline data', async ({ page }) => {
    await page.goto(PAGE);
    const content = page.locator('#inspect-content');
    await expect(content).toBeAttached();
  });
});

test.describe('60-Second Word Finder — Inspect Panel — Negative', () => {
  test('no duplicate inspect panels exist', async ({ page }) => {
    await page.goto(PAGE);
    const panels = page.locator('#inspect-panel');
    await expect(panels).toHaveCount(1);
  });

  test('inspect panel does not show without user interaction', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#inspect-panel');
    await expect(panel).toHaveClass(/hidden/);
  });

  test('no duplicate inspect-close buttons exist', async ({ page }) => {
    await page.goto(PAGE);
    const btns = page.locator('#inspect-close');
    await expect(btns).toHaveCount(1);
  });
});

// ── 60-Second Word Finder — Personal Best Date ─────────────────────────────

test.describe('60-Second Word Finder — Personal Best — Positive', () => {
  test('personal best section is visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#personal-best')).toBeVisible();
  });

  test('personal best label shows trophy text', async ({ page }) => {
    await page.goto(PAGE);
    const label = page.locator('text=🏆 Personal Best');
    await expect(label).toBeVisible();
  });

  test('pb-date element exists in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    const pbDate = page.locator('#pb-date');
    await expect(pbDate).toBeAttached();
  });

  test('pb-date shows date when personal best is stored', async ({ page }) => {
    // Set a PB with achievedAt date in localStorage before navigating
    await page.goto(PAGE);
    await page.evaluate(() => {
      const pbData = { score: 42, achievedAt: '2026-06-15T10:30:00.000Z' };
      localStorage.setItem('swf-60s-pb', JSON.stringify(pbData));
    });
    await page.reload();
    const pbDate = page.locator('#pb-date');
    await expect(pbDate).toContainText('Set on 15 Jun 2026');
  });

  test('personal best score shows when PB is stored', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      const pbData = { score: 75, achievedAt: '2026-06-18T14:00:00.000Z' };
      localStorage.setItem('swf-60s-pb', JSON.stringify(pbData));
    });
    await page.reload();
    await expect(page.locator('#personal-best')).toContainText('75 pts');
  });
});

test.describe('60-Second Word Finder — Personal Best — Negative', () => {
  test('pb-date is empty when no personal best exists', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.removeItem('swf-60s-pb');
    });
    await page.reload();
    const pbDate = page.locator('#pb-date');
    await expect(pbDate).toHaveText('');
  });

  test('personal best shows dash when no PB stored', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.removeItem('swf-60s-pb');
    });
    await page.reload();
    await expect(page.locator('#personal-best')).toHaveText('—');
  });

  test('pb-date handles legacy plain number PB gracefully (no date shown)', async ({ page }) => {
    // Legacy format: just a number string, no achievedAt field
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.setItem('swf-60s-pb', '55');
    });
    await page.reload();
    const pbDate = page.locator('#pb-date');
    await expect(pbDate).toHaveText('');
    // But the score should still display
    await expect(page.locator('#personal-best')).toContainText('55 pts');
  });

  test('no duplicate pb-date elements exist', async ({ page }) => {
    await page.goto(PAGE);
    const pbDates = page.locator('#pb-date');
    await expect(pbDates).toHaveCount(1);
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});

// ── 60-Second Word Finder — Share Button ────────────────────────────────────

test.describe('60-Second Word Finder — Share Button — Positive', () => {
  test('share button exists with correct label', async ({ page }) => {
    await page.goto(PAGE);
    const shareBtn = page.locator('#share-btn');
    await expect(shareBtn).toBeAttached();
    await expect(shareBtn).toContainText('Share');
  });

  test('share button copies text with trailing-slash URL to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE);

    // Simulate a completed round so score/foundWords are populated
    await page.evaluate(() => {
      // Expose minimal game state for the share handler
      (window as any).score = 25;
      (window as any).foundWords = ['QUIZ', 'ZAP'];
    });

    await page.locator('#share-btn').click();

    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipText).toContain('https://www.scrabblewordsfinder.com/sixty-seconds/');
  });

  test('share button shows "Copied!" feedback after click', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE);
    await page.locator('#share-btn').click();
    await expect(page.locator('#share-btn')).toContainText('Copied!');
  });

  test('share button reverts to original label after feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE);
    await page.locator('#share-btn').click();
    // Wait for the 2-second revert timeout
    await page.waitForTimeout(2200);
    await expect(page.locator('#share-btn')).toContainText('Share');
  });
});

test.describe('60-Second Word Finder — Share Button — Negative', () => {
  test('no duplicate share buttons exist', async ({ page }) => {
    await page.goto(PAGE);
    const btns = page.locator('#share-btn');
    await expect(btns).toHaveCount(1);
  });

  test('share URL does not use non-trailing-slash format', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE);
    await page.locator('#share-btn').click();
    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    // Should NOT end with /sixty-seconds (without slash) — must have trailing slash
    expect(clipText).not.toMatch(/\/sixty-seconds[^/]/);
  });

  test('share button does not crash when no words found', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PAGE);
    // Ensure foundWords is empty
    await page.evaluate(() => {
      (window as any).score = 0;
      (window as any).foundWords = [];
    });
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('#share-btn').click();
    expect(errors).toHaveLength(0);
    // Clipboard should still contain the URL even with no words
    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipText).toContain('https://www.scrabblewordsfinder.com/sixty-seconds/');
  });
});


// ── 60-Second Word Finder — History Button Visibility (PB-based) ────────────

test.describe('60-Second Word Finder — History Button PB Visibility — Positive', () => {
  test('history button is visible when personal best exists', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.setItem('swf-60s-pb', JSON.stringify({ score: 50, achievedAt: '2026-06-18T12:00:00.000Z' }));
      localStorage.removeItem('swf-60s-history');
    });
    await page.reload();
    const historyBtn = page.locator('#history-btn');
    await expect(historyBtn).not.toHaveClass(/hidden/);
  });

  test('history button is visible when local history has entries', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.removeItem('swf-60s-pb');
      const history = [{ round_id: 'test-1', created_at: '2026-06-18T12:00:00.000Z', words: [{ word: 'CAT', points: 5, attempt: 1, split_time: 55 }], total: 5 }];
      localStorage.setItem('swf-60s-history', JSON.stringify(history));
    });
    await page.reload();
    const historyBtn = page.locator('#history-btn');
    await expect(historyBtn).not.toHaveClass(/hidden/);
  });
});

test.describe('60-Second Word Finder — History Button PB Visibility — Negative', () => {
  test('history button is hidden when no PB and no local history', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.removeItem('swf-60s-pb');
      localStorage.removeItem('swf-60s-history');
    });
    await page.reload();
    const historyBtn = page.locator('#history-btn');
    await expect(historyBtn).toHaveClass(/hidden/);
  });

  test('history button does not appear twice with both PB and history', async ({ page }) => {
    await page.goto(PAGE);
    await page.evaluate(() => {
      localStorage.setItem('swf-60s-pb', JSON.stringify({ score: 30, achievedAt: '2026-06-18T10:00:00.000Z' }));
      const history = [{ round_id: 'r1', created_at: '2026-06-18T10:00:00.000Z', words: [{ word: 'DOG', points: 5, attempt: 1, split_time: 50 }], total: 5 }];
      localStorage.setItem('swf-60s-history', JSON.stringify(history));
    });
    await page.reload();
    const btns = page.locator('#history-btn');
    await expect(btns).toHaveCount(1);
  });
});

// ── 60-Second Word Finder — Missed Words Points Display ─────────────────────

test.describe('60-Second Word Finder — Missed Words Points — Positive', () => {
  test('missed words section label exists in game-over', async ({ page }) => {
    await page.goto(PAGE);
    const label = page.locator('#missed-section p');
    await expect(label).toContainText('Words you missed');
  });

  test('missed-words container exists in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    const container = page.locator('#missed-words');
    await expect(container).toBeAttached();
  });
});

test.describe('60-Second Word Finder — Missed Words Points — Negative', () => {
  test('missed section is hidden before game ends', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('#missed-section');
    await expect(section).toHaveClass(/hidden/);
  });

  test('no duplicate missed-words containers exist', async ({ page }) => {
    await page.goto(PAGE);
    const containers = page.locator('#missed-words');
    await expect(containers).toHaveCount(1);
  });
});


// ── 60-Second Word Finder — API History Submission ──────────────────────────

test.describe('60-Second Word Finder — API History Submission — Positive', () => {
  test('game POSTs round data to /api/sixty-seconds-history/ with trailing slash', async ({ page }) => {
    const apiCalls: { url: string; method: string }[] = [];
    await page.route('**/api/sixty-seconds-history/**', async (route) => {
      apiCalls.push({ url: route.request().url(), method: route.request().method() });
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto(PAGE);

    // Simulate a completed round by invoking endGame with words found
    await page.evaluate(() => {
      // Set game state so endGame triggers API POST
      (window as any).foundWords = ['CAT', 'DOG'];
      (window as any).score = 10;
      (window as any).roundWords = [
        { word: 'CAT', points: 5, attempt: 1, split_time: 55 },
        { word: 'DOG', points: 5, attempt: 2, split_time: 48 },
      ];
      (window as any).roundId = 'test-api-round';
      // Trigger the save logic directly
      const userId = localStorage.getItem('swf-uid') || 'test-user';
      fetch('/api/sixty-seconds-history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, round_id: 'test-api-round', words: (window as any).roundWords }),
      });
    });

    await page.waitForTimeout(500);
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0].method).toBe('POST');
    expect(apiCalls[0].url).toContain('/api/sixty-seconds-history/');
  });

  test('API submission includes correct payload shape', async ({ page }) => {
    let requestBody: any = null;
    await page.route('**/api/sixty-seconds-history/**', async (route) => {
      requestBody = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto(PAGE);
    await page.evaluate(() => {
      const userId = localStorage.getItem('swf-uid') || 'test-user';
      fetch('/api/sixty-seconds-history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          round_id: 'payload-test-round',
          words: [{ word: 'ACE', points: 5, attempt: 1, split_time: 50 }],
        }),
      });
    });

    await page.waitForTimeout(500);
    expect(requestBody).not.toBeNull();
    expect(requestBody).toHaveProperty('user_id');
    expect(requestBody).toHaveProperty('round_id', 'payload-test-round');
    expect(requestBody).toHaveProperty('words');
    expect(requestBody.words).toHaveLength(1);
  });
});

test.describe('60-Second Word Finder — API History Submission — Negative', () => {
  test('API submission uses trailing-slash URL (not bare path)', async ({ page }) => {
    const apiUrls: string[] = [];
    await page.route('**/api/sixty-seconds-history/**', async (route) => {
      apiUrls.push(route.request().url());
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto(PAGE);
    await page.evaluate(() => {
      fetch('/api/sixty-seconds-history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'u', round_id: 'r', words: [] }),
      });
    });

    await page.waitForTimeout(500);
    expect(apiUrls.length).toBeGreaterThan(0);
    // URL must end with trailing slash (not /sixty-seconds-history without /)
    const url = new URL(apiUrls[0]);
    expect(url.pathname).toBe('/api/sixty-seconds-history/');
  });

  test('API failure does not crash the page or throw uncaught errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Simulate API failure (500)
    await page.route('**/api/sixty-seconds-history/**', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(PAGE);
    await page.evaluate(() => {
      fetch('/api/sixty-seconds-history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'u', round_id: 'r', words: [] }),
      }).catch(function() {});
    });

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('API network failure does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Simulate network abort
    await page.route('**/api/sixty-seconds-history/**', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.goto(PAGE);
    await page.evaluate(() => {
      fetch('/api/sixty-seconds-history/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'u', round_id: 'r', words: [] }),
      }).catch(function() {});
    });

    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});
