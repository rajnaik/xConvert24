import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Badges Page — Positive', () => {
  test('badges page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    await expect(page).toHaveTitle(/Diamond Badges/);
  });

  test('Quick Reference table exists with 15 badge rows', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(15);
  });

  test('Quick Reference table shows correct badge names in order', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const rows = page.locator('table tbody tr');
    const expectedNames = [
      'Word Maker',
      'Word Smith',
      'Word Master',
      'Word Wizard',
      'Grand Lexicon',
      'Scrabble Sage',
      'Lex Legend',
      'Vocabulary Virtuoso',
      'Dictionary Guardian',
      'Letter Lord',
      'Tile Titan',
      'Word Emperor',
      'Lexicon Immortal',
      'Alphabet Ascendant',
      'Grand Word Deity',
    ];
    for (let i = 0; i < expectedNames.length; i++) {
      await expect(rows.nth(i).locator('td').first()).toContainText(expectedNames[i]);
    }
  });

  test('Quick Reference table shows hour-based time estimates', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const rows = page.locator('table tbody tr');
    const expectedTimes = [
      '~0.4 hours',
      '~1.7 hours',
      '~4 hours',
      '~8 hours',
      '~17 hours',
      '~42 hours',
      '~83 hours',
      '~167 hours',
      '~333 hours',
      '~667 hours',
      '~1,250 hours',
      '~2,083 hours',
      '~4,167 hours',
      '~8,333 hours',
      '~16,667 hours',
    ];
    for (let i = 0; i < expectedTimes.length; i++) {
      const timeCell = rows.nth(i).locator('td').nth(4);
      await expect(timeCell).toHaveText(expectedTimes[i]);
    }
  });

  test('Quick Reference table shows correct diamond thresholds', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const rows = page.locator('table tbody tr');
    const expectedDiamonds = ['25', '100', '250', '500', '1,000', '2,500', '5,000', '10,000', '20,000', '40,000', '75,000', '125,000', '250,000', '500,000', '1,000,000'];
    for (let i = 0; i < expectedDiamonds.length; i++) {
      const diamondCell = rows.nth(i).locator('td').nth(2);
      await expect(diamondCell).toHaveText(expectedDiamonds[i]);
    }
  });

  test('Quick Reference table has Theme column with correct values', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const rows = page.locator('table tbody tr');
    const expectedThemes = [
      'Beginner',
      'Crafter',
      'Skilled',
      'Magical',
      'Vocabulary',
      'Wise',
      'Legendary',
      'Elite',
      'Protector of words',
      'Commander',
      'Giant',
      'Royal',
      'Eternal',
      'Mythical',
      'Ultimate',
    ];
    for (let i = 0; i < expectedThemes.length; i++) {
      const themeCell = rows.nth(i).locator('td').nth(3);
      await expect(themeCell).toHaveText(expectedThemes[i]);
    }
  });

  test('page contains FAQPage structured data', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const ldJson = page.locator('script[type="application/ld+json"]');
    const count = await ldJson.count();
    expect(count).toBeGreaterThanOrEqual(1);
    let hasFaq = false;
    for (let i = 0; i < count; i++) {
      const content = await ldJson.nth(i).textContent();
      if (content && content.includes('FAQPage')) {
        hasFaq = true;
        break;
      }
    }
    expect(hasFaq).toBe(true);
  });

  test('page links to Diamond Hunt and MyBag', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const diamondHuntLinks = page.locator('a[href="/diamond-hunt/"]');
    expect(await diamondHuntLinks.count()).toBeGreaterThanOrEqual(1);
    const mybagLinks = page.locator('a[href="/mybag/"]');
    expect(await mybagLinks.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Badges Page — Negative', () => {
  test('no duplicate tables on the page', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const tables = page.locator('table');
    await expect(tables).toHaveCount(1);
  });

  test('time estimates do not use month/year format', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const timeCells = page.locator('table tbody tr td:nth-child(5)');
    const count = await timeCells.count();
    for (let i = 0; i < count; i++) {
      const text = await timeCells.nth(i).textContent();
      expect(text).not.toMatch(/month|year/i);
    }
  });

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/badges/`);
    expect(errors).toHaveLength(0);
  });

  test('badge images have valid src paths', async ({ page }) => {
    await page.goto(`${BASE}/badges/`);
    const imgs = page.locator('table tbody tr img');
    const count = await imgs.count();
    expect(count).toBe(15);
    for (let i = 0; i < count; i++) {
      const src = await imgs.nth(i).getAttribute('src');
      expect(src).toMatch(/^\/badges\/.*\.svg$/);
    }
  });
});
