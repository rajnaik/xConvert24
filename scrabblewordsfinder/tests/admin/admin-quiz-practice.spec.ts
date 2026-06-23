import { test, expect } from '@playwright/test';

const PAGE = '/admin/quiz-practice/';

test.describe('Admin Quiz & Practice — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible and correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('main h1');
    await expect(h1).toContainText('Word Quiz & Practice');
  });

  test('noindex meta tag present', async ({ page }) => {
    await page.goto(PAGE);
    const meta = page.locator('meta[name="robots"]');
    await expect(meta).toHaveAttribute('content', /noindex/);
  });

  test('stats section renders 8 stat boxes after data loads', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const stats = document.getElementById('stats');
      return stats && stats.children.length === 8;
    }, { timeout: 8000 });
    const stats = page.locator('#stats > div');
    await expect(stats).toHaveCount(8);
  });

  test('Quiz Scores tab button is active by default', async ({ page }) => {
    await page.goto(PAGE);
    const quizTab = page.locator('#tab-quiz');
    await expect(quizTab).toHaveClass(/bg-blue-600/);
  });

  test('Practice Sessions tab button is styled as inactive by default', async ({ page }) => {
    await page.goto(PAGE);
    const practiceTab = page.locator('#tab-practice');
    await expect(practiceTab).toHaveClass(/bg-gray-800/);
  });

  test('quiz section is visible after data loads', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-section');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });
    await expect(page.locator('#quiz-section')).toBeVisible();
  });

  test('practice section is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(2000);
    await expect(page.locator('#practice-section')).toBeHidden();
  });

  test('clicking Practice tab shows practice section and hides quiz', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-section');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });
    await page.locator('#tab-practice').click();
    await expect(page.locator('#practice-section')).toBeVisible();
    await expect(page.locator('#quiz-section')).toBeHidden();
    await expect(page.locator('#tab-practice')).toHaveClass(/bg-green-600/);
  });

  test('clicking Quiz tab switches back to quiz section', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-section');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });
    await page.locator('#tab-practice').click();
    await page.locator('#tab-quiz').click();
    await expect(page.locator('#quiz-section')).toBeVisible();
    await expect(page.locator('#practice-section')).toBeHidden();
    await expect(page.locator('#tab-quiz')).toHaveClass(/bg-blue-600/);
  });

  test('quiz section contains user groups as details elements', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-groups');
      return el && el.querySelectorAll('details').length > 0;
    }, { timeout: 8000 });
    const groups = page.locator('#quiz-groups details');
    const count = await groups.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each quiz group has a summary with user ID and stats', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-groups');
      return el && el.querySelectorAll('details').length > 0;
    }, { timeout: 8000 });
    const firstSummary = page.locator('#quiz-groups details summary').first();
    const text = await firstSummary.textContent();
    // Should contain a truncated user ID and quiz count
    expect(text).toMatch(/quiz/i);
  });

  test('each quiz group has a table with correct headers', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-groups');
      return el && el.querySelectorAll('details').length > 0;
    }, { timeout: 8000 });
    const firstTable = page.locator('#quiz-groups details table').first();
    const headers = await firstTable.locator('thead th').allTextContents();
    expect(headers).toEqual(['Score', 'Time', 'Timer', 'Result', 'Date']);
  });

  test('practice section contains user groups as details elements', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-section');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });
    await page.locator('#tab-practice').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('practice-groups');
      return el && el.querySelectorAll('details').length > 0;
    }, { timeout: 8000 });
    const groups = page.locator('#practice-groups details');
    const count = await groups.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each practice group has a table with correct headers', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-section');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });
    await page.locator('#tab-practice').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('practice-groups');
      return el && el.querySelectorAll('details').length > 0;
    }, { timeout: 8000 });
    const firstTable = page.locator('#practice-groups details table').first();
    const headers = await firstTable.locator('thead th').allTextContents();
    expect(headers).toEqual(['Word', 'Meaning', 'Date']);
  });

  test('quiz groups are collapsible (details toggle)', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-groups');
      return el && el.querySelectorAll('details').length > 0;
    }, { timeout: 8000 });
    const firstGroup = page.locator('#quiz-groups details').first();
    // Initially open
    await expect(firstGroup).toHaveAttribute('open', '');
    // Click summary to close
    await firstGroup.locator('summary').click();
    await expect(firstGroup).not.toHaveAttribute('open', '');
    // Click to re-open
    await firstGroup.locator('summary').click();
    await expect(firstGroup).toHaveAttribute('open', '');
  });
});

test.describe('Admin Quiz & Practice — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(4000);
    expect(errors).toHaveLength(0);
  });

  test('no duplicate quiz-section containers', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#quiz-section')).toHaveCount(1);
  });

  test('no duplicate practice-section containers', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#practice-section')).toHaveCount(1);
  });

  test('loading indicator disappears after data loads', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('loading');
      return el && el.classList.contains('hidden');
    }, { timeout: 8000 });
    await expect(page.locator('#loading')).toBeHidden();
  });

  test('no console errors when switching tabs rapidly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const el = document.getElementById('quiz-section');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });
    for (let i = 0; i < 5; i++) {
      await page.locator('#tab-practice').click();
      await page.waitForTimeout(100);
      await page.locator('#tab-quiz').click();
      await page.waitForTimeout(100);
    }
    expect(errors).toHaveLength(0);
  });

  test('APIs return valid JSON (quiz-scores)', async ({ page }) => {
    await page.goto(PAGE);
    const data = await page.evaluate(async () => {
      const res = await fetch('/api/quiz-scores/');
      return { ok: res.ok, status: res.status, body: await res.json() };
    });
    expect(data.ok).toBe(true);
    expect(data.body).toHaveProperty('scores');
    expect(Array.isArray(data.body.scores)).toBe(true);
  });

  test('APIs return valid JSON (wordbench-practice)', async ({ page }) => {
    await page.goto(PAGE);
    const data = await page.evaluate(async () => {
      const res = await fetch('/api/wordbench-practice/?user_id=__all__');
      return { ok: res.ok, status: res.status, body: await res.json() };
    });
    expect(data.ok).toBe(true);
    expect(data.body).toHaveProperty('records');
    expect(Array.isArray(data.body.records)).toBe(true);
  });

  test('page handles empty quiz data gracefully', async ({ page }) => {
    // Even if quiz-groups has no details, the container should exist and not crash
    await page.goto(PAGE);
    await page.waitForTimeout(4000);
    await expect(page.locator('#quiz-groups')).toHaveCount(1);
  });

  test('page handles empty practice data gracefully', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(2000);
    await page.locator('#tab-practice').click();
    await page.waitForTimeout(2000);
    await expect(page.locator('#practice-groups')).toHaveCount(1);
  });
});
