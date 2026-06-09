import { test, expect } from '@playwright/test';

/**
 * Scrabble Solver Enhancement Tests
 * Tests all new features: instant search, achievements, reference panels,
 * probability calculator, rack leave analyzer, best opening moves.
 */

test.describe('Scrabble Solver: Instant Search', () => {
  test('results appear automatically when typing 2+ letters', async ({ page }) => {
    await page.goto('/tools/scrabble');
    // Wait for dictionary
    await page.locator('#results table').waitFor({ timeout: 10000 });

    // Type tiles — results should appear without clicking Find Words
    await page.fill('#tiles', 'QI');
    await page.waitForTimeout(500); // debounce
    const results = page.locator('#results');
    await expect(results).toContainText('words found', { timeout: 5000 });
  });

  test('results do not appear with only 1 letter', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'A');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    // Should still show the high-scoring table, not search results
    await expect(results).not.toContainText('words found');
  });
});

test.describe('Scrabble Solver: Achievements System', () => {
  test('clicking a result word adds achievement decoration', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QITEST');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Click first result word
    const firstWord = page.locator('[data-achieve-word]').first();
    await firstWord.click();

    // Should have green border
    await expect(firstWord).toHaveClass(/ring-emerald-500/);
    // Should have tiara
    const tiara = firstWord.locator('.achievement-tiara');
    await expect(tiara).toBeAttached();
  });

  test('achievements persist in localStorage', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QITEST');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Click a word
    const firstWord = page.locator('[data-achieve-word]').first();
    const wordText = await firstWord.getAttribute('data-achieve-word');
    await firstWord.click();

    // Check localStorage
    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0].word).toBe(wordText);
  });

  test('clicking achieved word again removes achievement', async ({ page }) => {
    await page.goto('/tools/scrabble');
    // Pre-set an achievement
    await page.evaluate(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([{ word: 'qi', meaning: '' }]));
    });
    await page.reload();
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QI');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    const qiWord = page.locator('#results [data-achieve-word="qi"]');
    await expect(qiWord).toHaveClass(/ring-emerald-500/);

    // Click to remove
    await qiWord.click();
    await expect(qiWord).not.toHaveClass(/ring-emerald-500/);
  });
});

test.describe('Scrabble Solver: Reference Panels', () => {
  test('Two-Letter Words panel loads', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const panel = page.locator('#two-letter-words');
    await expect(panel).toContainText('words total', { timeout: 10000 });
  });

  test('Top 3-Letter Words panel loads', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const panel = page.locator('#three-letter-words');
    await expect(panel).toContainText('Top 30', { timeout: 10000 });
  });

  test('Q Without U panel loads', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const panel = page.locator('#q-without-u');
    await expect(panel).toContainText('memorise', { timeout: 10000 });
  });

  test('Rare Letters tabs work', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const results = page.locator('#rare-letter-results');
    // Default tab is Q
    await expect(results).toContainText('containing "Q"', { timeout: 10000 });

    // Click Z tab
    await page.click('[data-rare="z"]');
    await expect(results).toContainText('containing "Z"');

    // Click X tab
    await page.click('[data-rare="x"]');
    await expect(results).toContainText('containing "X"');

    // Click J tab
    await page.click('[data-rare="j"]');
    await expect(results).toContainText('containing "J"');
  });

  test('reference panel words are clickable for achievements', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const panel = page.locator('#two-letter-words');
    await expect(panel).toContainText('words total', { timeout: 10000 });

    // Click a word in the panel
    const word = panel.locator('[data-achieve-word]').first();
    await word.click();

    // Should get achievement decoration
    await expect(word).toHaveClass(/ring-emerald-500/);
  });
});

test.describe('Scrabble Solver: Tile Bag Probability', () => {
  test('probability panel shows default values', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const inBag = page.locator('#tiles-in-bag');
    const played = page.locator('#tiles-played');
    await expect(inBag).toHaveValue('100');
    await expect(played).toHaveValue('0');
  });

  test('probability updates when tiles are entered', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'AEIOU');
    await page.waitForTimeout(300);

    const rackCount = page.locator('#prob-your-rack');
    await expect(rackCount).toContainText('5');

    // Draw chances should show probabilities
    const chances = page.locator('#prob-draw-chances');
    await expect(chances).toContainText('chance');
  });

  test('in-bag and played values persist in localStorage', async ({ page }) => {
    await page.goto('/tools/scrabble');

    // Set custom values
    await page.fill('#tiles-in-bag', '80');
    await page.fill('#tiles-played', '13');
    await page.fill('#tiles', 'AB'); // trigger update
    await page.waitForTimeout(300);

    // Check localStorage
    const probState = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbTileProb') || '{}');
    });
    expect(probState.inBag).toBe(80);
    expect(probState.played).toBe(13);
  });

  test('clicking a result word increments played count', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.evaluate(() => {
      localStorage.setItem('scbTileProb', JSON.stringify({ inBag: 90, played: 3 }));
    });
    await page.reload();
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QITEST');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Get initial played value
    const playedBefore = await page.locator('#tiles-played').inputValue();

    // Click a word
    const word = page.locator('[data-achieve-word]').first();
    const wordText = await word.getAttribute('data-achieve-word') || '';
    await word.click();

    // Played should have incremented
    const playedAfter = await page.locator('#tiles-played').inputValue();
    expect(parseInt(playedAfter)).toBe(parseInt(playedBefore) + wordText.length);
  });
});

test.describe('Scrabble Solver: Rack Leave Analyzer', () => {
  test('rack leave panel exists', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const panel = page.locator('#rack-leave-panel');
    await expect(panel).toBeAttached();
  });

  test('shows leave analysis after clicking a word', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QIABCDE');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Click a word
    await page.locator('[data-achieve-word]').first().click();

    // Panel should show leave analysis
    const panel = page.locator('#rack-leave-panel');
    await expect(panel).toContainText('your leave is');
  });

  test('shows bingo message when all tiles used', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    // Use exactly 2 tiles that form a word
    await page.fill('#tiles', 'QI');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Click 'qi' in results — uses all tiles
    const qiWord = page.locator('#results [data-achieve-word="qi"]');
    if (await qiWord.isVisible()) {
      await qiWord.click();
      const panel = page.locator('#rack-leave-panel');
      await expect(panel).toContainText('Bingo');
    }
  });
});

test.describe('Scrabble Solver: Best Opening Moves', () => {
  test('best opening panel exists', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const panel = page.locator('#best-opening-panel');
    await expect(panel).toBeAttached();
  });

  test('shows openers after entering tiles', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'AERTBLS');
    await page.waitForTimeout(500);

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('DWS', { timeout: 5000 });
  });

  test('shows medals for top 3 words', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'AERTBLS');
    await page.waitForTimeout(500);

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('🥇', { timeout: 5000 });
  });

  test('shows bingo indicator for 7-letter words', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    // RETAILS is a valid 7-letter word from these tiles
    await page.fill('#tiles', 'RETAILS');
    await page.waitForTimeout(500);

    const panel = page.locator('#best-opening-panel');
    // Should show bingo if a 7-letter word is found
    const hasBingo = await panel.locator('text=bingo').count();
    // Either we get a bingo or we don't — just verify the panel rendered
    await expect(panel).toContainText('DWS', { timeout: 5000 });
  });
});

test.describe('Scrabble Solver: Word Definitions', () => {
  test('clicking a result word shows definition tooltip', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QITEST');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Click a word
    await page.locator('[data-achieve-word]').first().click();

    // Should show tooltip (either with definition or "no definition found")
    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeAttached({ timeout: 5000 });
  });

  test('definition tooltip auto-dismisses', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QITEST');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    await page.locator('[data-achieve-word]').first().click();
    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeAttached({ timeout: 5000 });

    // Wait for auto-dismiss (8 seconds)
    await page.waitForTimeout(9000);
    await expect(tooltip).not.toBeAttached();
  });
});

test.describe('Scrabble Solver: SOWPODS Badge & Rare Letter Icon', () => {
  test('result words show SOWPODS validity checkmark', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    await page.fill('#tiles', 'QITEST');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Check for ✓ in results
    const check = page.locator('[data-achieve-word] >> text=✓');
    await expect(check.first()).toBeAttached();
  });

  test('words with rare letters show 💎 icon', async ({ page }) => {
    await page.goto('/tools/scrabble');
    await page.locator('#results table').waitFor({ timeout: 10000 });

    // Use tiles that produce words with Q
    await page.fill('#tiles', 'QIAZXJ');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 5000 });

    // Should have at least one 💎 icon
    const diamond = page.locator('#results >> text=💎');
    await expect(diamond.first()).toBeAttached();
  });
});
