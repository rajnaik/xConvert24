import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── DRC Duplicate Submission Check — Positive ───────────────────────────

test.describe('DRC Duplicate Submission — Positive', () => {
  test('shows duplicate error when submitting a word already in userWords', async ({ page }) => {
    // Mock the daily-rack API to return a rack + an existing submission
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: 'CATFISH',
            best_score: 75,
            userScores: [{ word: 'CAT', score: 5 }],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-dup-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Try submitting the same word that's already in userScores
    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/);
    await expect(fb).toContainText("You already submitted");
    await expect(fb).toContainText('CAT');
  });

  test('duplicate check is case-insensitive (lowercase input matches uppercase stored)', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'FISHCAT',
            best_word: null,
            best_score: 0,
            userScores: [{ word: 'FISH', score: 10 }],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-dup-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Submit 'fish' in lowercase — stored as 'FISH'
    await page.fill('#drc-input', 'fish');
    await page.click('#drc-submit');

    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/);
    await expect(fb).toContainText("You already submitted");
  });
});

// ── DRC Duplicate Submission Check — Negative ───────────────────────────

test.describe('DRC Duplicate Submission — Negative', () => {
  test('does not show duplicate error for a new word not yet submitted', async ({ page }) => {
    let postCalled = false;
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [{ word: 'CAT', score: 5 }],
          }),
        });
      } else {
        postCalled = true;
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      }
    });
    // Mock the dictionary API so fetchMeaning resolves
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'A type of seafood' }] }] }]),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-dup-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Submit 'FISH' which is different from the existing 'CAT'
    await page.fill('#drc-input', 'fish');
    await page.click('#drc-submit');

    // Should succeed — green feedback, not the red duplicate error
    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(fb).toContainText('pts!');
    await expect(fb).not.toContainText('already submitted');
  });

  test('duplicate error shows red styling (not green success)', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [{ word: 'CAT', score: 5 }],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-dup-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    const fb = page.locator('#drc-feedback');
    await expect(fb).not.toHaveClass(/hidden/);
    // Should have red error styling
    const classes = await fb.getAttribute('class');
    expect(classes).toContain('bg-red-900/30');
    expect(classes).toContain('text-red-300');
    // Should NOT have green success styling
    expect(classes).not.toContain('bg-green-900/30');
  });
});

// ── DRC Rack History Save on Submit — Positive ──────────────────────────

test.describe('DRC Rack History Save on Submit — Positive', () => {
  test('successful submission POSTs to /api/rack-history/ with word, score, and meaning', async ({ page }) => {
    let rackHistoryPayload: any = null;

    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'QUIZXYZ',
            best_word: null,
            best_score: 0,
            userScores: [],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history/**', route => {
      if (route.request().method() === 'POST') {
        rackHistoryPayload = JSON.parse(route.request().postData() || '{}');
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      } else {
        const url = route.request().url();
        if (url.includes('count=true')) {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
        } else {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [], racks: {} }) });
        }
      }
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'A test of knowledge' }] }] }]),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-save-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    await page.fill('#drc-input', 'quiz');
    await page.click('#drc-submit');

    // Wait for the success feedback to appear (indicates both fetches completed)
    await expect(page.locator('#drc-feedback')).toContainText('pts!', { timeout: 8000 });

    // Give the rack-history POST time to complete (it's async after main submit)
    await page.waitForTimeout(1500);

    expect(rackHistoryPayload).not.toBeNull();
    expect(rackHistoryPayload.user_id).toBe('test-history-save-user');
    expect(rackHistoryPayload.word).toBe('QUIZ');
    expect(rackHistoryPayload.score).toBe(22); // Q10+U1+I1+Z10
    expect(rackHistoryPayload.meaning).toBe('A test of knowledge');
  });

  test('history button appears after successful rack-history save when count > 1', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history/**', route => {
      if (route.request().method() === 'POST') {
        // Return count > 1 to trigger history button visibility
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 3 }) });
      } else {
        const url = route.request().url();
        if (url.includes('count=true')) {
          // Initially 0 so button is hidden
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
        } else {
          route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [], racks: {} }) });
        }
      }
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'A feline' }] }] }]),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-save-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Initially hidden
    const btn = page.locator('#drc-history-btn');
    await expect(btn).toHaveClass(/hidden/);

    // Submit a word
    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    // Wait for success + rack-history POST to complete
    await expect(page.locator('#drc-feedback')).toContainText('pts!', { timeout: 8000 });

    // History button should become visible (count returned 3 > 1)
    await expect(btn).not.toHaveClass(/hidden/, { timeout: 5000 });
  });
});

// ── DRC Rack History Save on Submit — Negative ──────────────────────────

test.describe('DRC Rack History Save on Submit — Negative', () => {
  test('rack-history POST is NOT made when user has no swf-uid', async ({ page }) => {
    let rackHistoryPostCalled = false;

    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history/**', route => {
      if (route.request().method() === 'POST') {
        rackHistoryPostCalled = true;
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'A feline' }] }] }]),
      });
    });
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    // Wait for submit to complete
    await expect(page.locator('#drc-feedback')).toContainText('pts!', { timeout: 8000 });
    await page.waitForTimeout(1000);

    // rack-history POST should NOT have been called
    expect(rackHistoryPostCalled).toBe(false);
  });

  test('rack-history API failure does not crash the page or block success feedback', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: null,
            best_score: 0,
            userScores: [],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history/**', route => {
      if (route.request().method() === 'POST') {
        // Simulate server error
        route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"internal"}' });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
      }
    });
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ meanings: [{ definitions: [{ definition: 'A feline' }] }] }]),
      });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-error-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    await page.fill('#drc-input', 'cat');
    await page.click('#drc-submit');

    // Success feedback should still appear (rack-history failure is non-blocking)
    const fb = page.locator('#drc-feedback');
    await expect(fb).toContainText('pts!', { timeout: 8000 });
    await expect(fb).not.toContainText('Failed');

    // No JS errors
    await page.waitForTimeout(500);
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'));
    expect(critical).toHaveLength(0);
  });

  test('meaning is empty string when dictionary API fails (graceful degradation)', async ({ page }) => {
    let rackHistoryPayload: any = null;

    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'XYZQPWL',
            best_word: null,
            best_score: 0,
            userScores: [],
          }),
        });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/api/rack-history/**', route => {
      if (route.request().method() === 'POST') {
        rackHistoryPayload = JSON.parse(route.request().postData() || '{}');
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
      }
    });
    // Dictionary API fails
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({ status: 404, contentType: 'application/json', body: '{"title":"No Definitions Found"}' });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-meaning-fail-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Submit 'XYZ' — a word the dictionary API won't know
    await page.fill('#drc-input', 'xyz');
    await page.click('#drc-submit');

    await expect(page.locator('#drc-feedback')).toContainText('pts!', { timeout: 8000 });
    await page.waitForTimeout(1500);

    // Rack history should still have been called, with empty meaning
    expect(rackHistoryPayload).not.toBeNull();
    expect(rackHistoryPayload.meaning).toBe('');
  });
});
