import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Lex Quiz Coach Modal — Positive ────────────────────────────────────────

test.describe('Lex Quiz Coach Modal — Positive', () => {
  test('Lex Quiz Coach button is visible in the quiz panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator('button#LexQuiz');
    await expect(lexBtn).toBeVisible();
    await expect(lexBtn).toContainText('Lex Quiz Coach');
  });

  test('Lex button is a button element (not a link)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator('button#LexQuiz');
    await expect(lexBtn).toHaveAttribute('type', 'button');
  });

  test('clicking the Lex button opens the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const modal = page.locator('#lex-quiz-modal');
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('modal displays the Lex avatar and title', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const title = page.locator('#lex-quiz-modal-title');
    await expect(title).toHaveText('Lex Quiz Coach');
    const avatar = page.locator('#lex-quiz-modal img[alt="Lex"]');
    await expect(avatar).toBeVisible();
  });

  test('modal shows loading spinner initially', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const loading = page.locator('#lex-quiz-loading');
    await expect(loading).toBeVisible();
  });

  test('modal eventually shows analysis or error (loading disappears)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const loading = page.locator('#lex-quiz-loading');
    await expect(loading).toBeHidden({ timeout: 15000 });
    const result = page.locator('#lex-quiz-result');
    const error = page.locator('#lex-quiz-error');
    const resultVisible = await result.isVisible();
    const errorVisible = await error.isVisible();
    expect(resultVisible || errorVisible).toBe(true);
  });

  test('analysis text is non-empty when result is shown', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 15000 });
    const result = page.locator('#lex-quiz-result');
    if (await result.isVisible()) {
      const text = page.locator('#lex-quiz-analysis-text');
      await expect(text).not.toHaveText('');
    }
  });

  test('close button dismisses the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const modal = page.locator('#lex-quiz-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await page.locator('#lex-quiz-close').click();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('clicking backdrop closes the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const modal = page.locator('#lex-quiz-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await page.locator('#lex-quiz-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(modal).toHaveClass(/hidden/);
  });

  test('pressing Escape closes the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    const modal = page.locator('#lex-quiz-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveClass(/hidden/);
  });
});

// ── Lex Quiz Coach Modal — Links Section ────────────────────────────────────

test.describe('Lex Quiz Coach Modal — Links Section', () => {
  test('links section exists inside the result container', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const linksSection = page.locator('#lex-quiz-links');
    await expect(linksSection).toBeAttached();
  });

  test('links section has "Further Exploration" heading', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const heading = page.locator('#lex-quiz-links p');
    await expect(heading).toContainText('Further Exploration');
  });

  test('contains link to best scrabble training tools blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-quiz-links a[href="/blog/best-scrabble-training-tools/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Best Scrabble Training Tools');
  });

  test('contains link to how to memorize scrabble words blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-quiz-links a[href="/blog/how-to-memorize-scrabble-words/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('How to Memorize Scrabble Words');
  });

  test('contains link to highest scoring scrabble words blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-quiz-links a[href="/blog/highest-scoring-scrabble-words/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Highest Scoring Scrabble Words');
  });

  test('contains link to rack management basics blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-quiz-links a[href="/blog/rack-management-basics/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Rack Management Basics');
  });

  test('contains link to quiz history page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-quiz-links a[href="/quiz-history/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Your Quiz History');
  });

  test('all links have trailing slashes', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const links = page.locator('#lex-quiz-links a');
    const count = await links.count();
    expect(count).toBe(5);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/\/$/);
    }
  });
});

// ── Lex Quiz Coach Modal — Negative ────────────────────────────────────────

test.describe('Lex Quiz Coach Modal — Negative', () => {
  test('modal is hidden by default on page load', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const modal = page.locator('#lex-quiz-modal');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('no duplicate modals exist on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const modals = page.locator('#lex-quiz-modal');
    await expect(modals).toHaveCount(1);
  });

  test('opening modal does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    await page.waitForTimeout(2000);
    expect(errors.filter((e) => e.toLowerCase().includes('lex') || e.toLowerCase().includes('quiz-coach'))).toHaveLength(0);
  });

  test('modal does not leave body scroll locked after closing', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('button#LexQuiz').click();
    await page.locator('#lex-quiz-close').click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });

  test('re-opening modal shows fresh loading state', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Open and wait for loading to finish
    await page.locator('button#LexQuiz').click();
    await page.locator('#lex-quiz-loading').waitFor({ state: 'hidden', timeout: 15000 });
    await page.locator('#lex-quiz-close').click();
    // Re-open
    await page.locator('button#LexQuiz').click();
    const loading = page.locator('#lex-quiz-loading');
    await expect(loading).toBeVisible();
  });

  test('no duplicate Lex Quiz Coach buttons exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btns = page.locator('button#LexQuiz');
    await expect(btns).toHaveCount(1);
  });
});

// ── Lex Quiz Coach API — Positive ──────────────────────────────────────────

test.describe('Lex Quiz Coach API — Positive', () => {
  test('POST /api/lex-quiz-coach/ returns valid JSON', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/lex-quiz-coach/`, {
      data: { user_id: `pw-lex-quiz-test-${Date.now()}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('analysis');
    expect(typeof body.analysis).toBe('string');
    expect(body.analysis.length).toBeGreaterThan(0);
  });

  test('returns hasHistory:false with wisdom for unknown user', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/lex-quiz-coach/`, {
      data: { user_id: `pw-no-history-${Date.now()}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.hasHistory).toBe(false);
    expect(body.analysis.length).toBeGreaterThan(50);
  });
});

// ── Lex Quiz Coach API — Negative ──────────────────────────────────────────

test.describe('Lex Quiz Coach API — Negative', () => {
  test('returns 400 when user_id is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/lex-quiz-coach/`, {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('user_id');
  });

  test('returns 400 for invalid JSON body', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/lex-quiz-coach/`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not json',
    });
    expect(res.status()).toBe(400);
  });
});
