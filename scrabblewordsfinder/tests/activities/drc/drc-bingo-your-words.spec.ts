import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── DRC Bingo Icon in "Your Words Today" — Positive ─────────────────────

test.describe('DRC Bingo Icon in Your Words — Positive', () => {
  test('7-letter word in userWords shows 🎯 bingo target icon', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'JINXING',
            best_word: 'JINXING',
            best_score: 22,
            userScores: [{ word: 'JINXING', score: 22 }],
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
      localStorage.setItem('swf-uid', 'test-bingo-icon-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    const yourList = page.locator('#drc-your-list');
    await expect(yourList).toContainText('JINXING');
    await expect(yourList).toContainText('🎯');
  });

  test('bingo icon has tooltip explaining it means all 7 tiles used', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'QUIZXYZ',
            best_word: 'QUIZXYZ',
            best_score: 40,
            userScores: [{ word: 'QUIZXYZ', score: 40 }],
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
      localStorage.setItem('swf-uid', 'test-bingo-icon-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    const bingoSpan = page.locator('#drc-your-list span[title="Bingo! All 7 tiles used"]');
    await expect(bingoSpan).toHaveCount(1);
    await expect(bingoSpan).toContainText('🎯');
  });
});

// ── DRC Bingo Icon in "Your Words Today" — Negative ─────────────────────

test.describe('DRC Bingo Icon in Your Words — Negative', () => {
  test('words shorter than 7 letters do NOT show 🎯 icon', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: 'CAT',
            best_score: 5,
            userScores: [
              { word: 'CAT', score: 5 },
              { word: 'FISH', score: 10 },
              { word: 'AT', score: 2 },
            ],
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
      localStorage.setItem('swf-uid', 'test-bingo-icon-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    const yourList = page.locator('#drc-your-list');
    await expect(yourList).toContainText('CAT');
    await expect(yourList).toContainText('FISH');
    await expect(yourList).not.toContainText('🎯');
  });

  test('mix of bingo and non-bingo words only shows icon on 7-letter entries', async ({ page }) => {
    await page.route('**/api/daily-rack/**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            rack: 'CATFISH',
            best_word: 'CATFISH',
            best_score: 75,
            userScores: [
              { word: 'CATFISH', score: 75 },
              { word: 'CAT', score: 5 },
              { word: 'FISH', score: 10 },
            ],
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
      localStorage.setItem('swf-uid', 'test-bingo-icon-user');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    // Only one 🎯 icon should appear (for CATFISH, 7 letters)
    const bingoIcons = page.locator('#drc-your-list span[title="Bingo! All 7 tiles used"]');
    await expect(bingoIcons).toHaveCount(1);

    // Total word entries should be 3
    const wordSpans = page.locator('#drc-your-list > span');
    await expect(wordSpans).toHaveCount(3);
  });
});
