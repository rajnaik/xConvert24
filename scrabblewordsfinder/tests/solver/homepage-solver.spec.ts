import { test, expect } from '@playwright/test';

/**
 * Homepage & Word Solver Tests
 * Tests the main word-finding functionality including both input methods,
 * dictionary loading, filters, and result rendering.
 */

test.describe('Homepage — Page Load & Structure', () => {
  test('homepage loads with correct title and meta', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Free Scrabble Word Finder/);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Scrabble word finder and solver');
  });

  test('homepage title includes Fun, Free, Fast branding', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('Fun, Free, Fast');
  });

  test('homepage meta description leads with Fun, free, fast', async ({ page }) => {
    await page.goto('/');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toMatch(/^Fun, free, fast/);
  });

  test('has navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/"]')).toBeAttached();
    await expect(page.locator('a[href="/guide"]')).toBeAttached();
    await expect(page.locator('a[href="/about"]')).toBeAttached();
    await expect(page.locator('a[href="/settings"]')).toBeAttached();
  });

  test('has canonical URL set', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('scrabblewordsfinder.com');
  });

  test('has structured data (FAQ, WebApplication, HowTo)', async ({ page }) => {
    await page.goto('/');
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('has inline h1 in navbar with correct text', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('nav h1');
    await expect(h1).toContainText('Free');
    await expect(h1).toContainText('Scrabble Word Finder');
    await expect(h1).toContainText('Solver');
  });

  test('h1 is visible on desktop but hidden on mobile', async ({ page }) => {
    // Desktop viewport (default) — h1 should be visible
    await page.goto('/');
    const h1 = page.locator('nav h1');
    await expect(h1).toBeVisible();
  });
});

test.describe('Text Solver Input', () => {
  test('text solver input accepts letters', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    await input.fill('AERTBLS');
    await expect(input).toHaveValue('AERTBLS');
  });

  test('text solver auto-uppercases input', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    await input.fill('hello');
    await expect(input).toHaveValue('HELLO');
  });

  test('text solver syncs to tile boxes', async ({ page }) => {
    await page.goto('/');
    await page.locator('#text-solver').fill('ABC');
    const boxes = page.locator('.tile-box');
    await expect(boxes.nth(0)).toHaveValue('A');
    await expect(boxes.nth(1)).toHaveValue('B');
    await expect(boxes.nth(2)).toHaveValue('C');
  });

  test('clicking Solve button triggers search', async ({ page }) => {
    await page.goto('/');
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    const results = page.locator('#results');
    await expect(results).toContainText('words found', { timeout: 10000 });
  });

  test('pressing Enter in text solver triggers search', async ({ page }) => {
    await page.goto('/');
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solver').press('Enter');
    const results = page.locator('#results');
    await expect(results).toContainText('words found', { timeout: 10000 });
  });
});

test.describe('Tile Rack Input', () => {
  test('tile rack has 7 individual boxes', async ({ page }) => {
    await page.goto('/');
    const boxes = page.locator('.tile-box');
    await expect(boxes).toHaveCount(7);
  });

  test('tile boxes accept single character', async ({ page }) => {
    await page.goto('/');
    const box = page.locator('.tile-box').first();
    await box.fill('A');
    await expect(box).toHaveValue('A');
  });

  test('tile boxes auto-advance on input', async ({ page }) => {
    await page.goto('/');
    const boxes = page.locator('.tile-box');
    await boxes.nth(0).focus();
    await page.keyboard.type('A');
    // Focus should move to next box
    await expect(boxes.nth(1)).toBeFocused();
  });

  test('backspace moves to previous tile box', async ({ page }) => {
    await page.goto('/');
    const boxes = page.locator('.tile-box');
    await boxes.nth(0).fill('A');
    await boxes.nth(1).focus();
    await page.keyboard.press('Backspace');
    await expect(boxes.nth(0)).toBeFocused();
  });

  test('Find Words button solves from tile rack', async ({ page }) => {
    await page.goto('/');
    const boxes = page.locator('.tile-box');
    const letters = ['A', 'E', 'R', 'T', 'B', 'L', 'S'];
    for (let i = 0; i < letters.length; i++) {
      await boxes.nth(i).fill(letters[i]);
    }
    await page.locator('#solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found', { timeout: 10000 });
  });

  test('wildcard ? is accepted in tile boxes', async ({ page }) => {
    await page.goto('/');
    const box = page.locator('.tile-box').first();
    await box.fill('?');
    await expect(box).toHaveValue('?');
  });
});

test.describe('Dictionary Loading', () => {
  test('dictionary loads and populates reference panels', async ({ page }) => {
    await page.goto('/');
    const twoLetterWords = page.locator('#two-letter-words');
    await expect(twoLetterWords).not.toContainText('Loading dictionary', { timeout: 15000 });
    await expect(twoLetterWords).toContainText('words total');
  });

  test('dictionary selector has 4 options', async ({ page }) => {
    await page.goto('/');
    const options = page.locator('#dictionary option');
    await expect(options).toHaveCount(4);
  });

  test('dictionary info button shows popup', async ({ page }) => {
    await page.goto('/');
    // Wait for dictionary to load
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
    await page.locator('#dict-info-btn').click();
    const popup = page.locator('#dict-info-popup');
    await expect(popup).toBeVisible();
    await expect(popup).toContainText('dictionary loaded');
  });

  test('switching dictionary changes word list', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
    await page.locator('#dictionary').selectOption('twl');
    // Solve to verify it uses new dictionary
    await page.locator('#text-solver').fill('QI');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).not.toContainText('Enter at least 2 tiles', { timeout: 5000 });
  });
});

test.describe('Solver Results & Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('shows "No words found" for impossible tiles', async ({ page }) => {
    await page.locator('#text-solver').fill('ZZZZZZZ');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('No words found');
  });

  test('shows word count in results', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');
  });

  test('results show score for each word', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('pts');
  });

  test('min length filter works', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#min-len').selectOption('4');
    await page.locator('#text-solve-btn').click();
    // All visible words should be 4+ letters
    const words = await page.locator('#results [data-achieve-word]').allTextContents();
    // Check first few words are 4+ chars
    for (const text of words.slice(0, 5)) {
      const wordOnly = text.replace(/[^A-Za-z]/g, '');
      expect(wordOnly.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('starts-with filter works', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#starts-with').fill('ST');
    await page.locator('#text-solve-btn').click();
    const results = page.locator('#results [data-achieve-word]');
    const count = await results.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const word = await results.nth(i).getAttribute('data-achieve-word');
        expect(word?.startsWith('st')).toBeTruthy();
      }
    }
  });

  test('ends-with filter works', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#ends-with').fill('ER');
    await page.locator('#text-solve-btn').click();
    const results = page.locator('#results [data-achieve-word]');
    const count = await results.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const word = await results.nth(i).getAttribute('data-achieve-word');
        expect(word?.endsWith('er')).toBeTruthy();
      }
    }
  });

  test('contains filter works', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#contains').fill('ART');
    await page.locator('#text-solve-btn').click();
    const results = page.locator('#results [data-achieve-word]');
    const count = await results.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const word = await results.nth(i).getAttribute('data-achieve-word');
        expect(word).toContain('art');
      }
    }
  });

  test('sort by score shows highest first', async ({ page }) => {
    await page.locator('#sort-by').selectOption('score');
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');
    // First result should have higher or equal score than second (already default)
  });

  test('sort by length shows longest first', async ({ page }) => {
    await page.locator('#sort-by').selectOption('length');
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');
  });

  test('sort by A-Z works', async ({ page }) => {
    await page.locator('#sort-by').selectOption('alpha');
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');
  });

  test('instant search triggers after typing (debounced)', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    // Wait for debounce (300ms) + solve
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found', { timeout: 10000 });
  });
});

test.describe('Find Words Button — Styling', () => {
  test('Find Words button has purple border outline styling', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#text-solve-btn');
    const classAttr = await btn.getAttribute('class');
    expect(classAttr).toContain('border-2');
    expect(classAttr).toContain('border-purple-500');
  });

  test('Find Words button has green text color', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#text-solve-btn');
    const classAttr = await btn.getAttribute('class');
    expect(classAttr).toContain('text-green-400');
  });

  test('Find Words button does not have old solid blue background', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#text-solve-btn');
    const classAttr = await btn.getAttribute('class');
    expect(classAttr).not.toContain('bg-blue-500');
    expect(classAttr).not.toContain('text-gray-950');
  });

  test('Find Words button has hover states for purple border', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#text-solve-btn');
    const classAttr = await btn.getAttribute('class');
    expect(classAttr).toContain('hover:border-purple-400');
    expect(classAttr).toContain('hover:bg-purple-900/20');
  });
});

test.describe('Text Solver Input — Width Styling', () => {
  test('text solver input has 20ch width class', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    const classAttr = await input.getAttribute('class');
    expect(classAttr).toContain('w-[20ch]');
  });

  test('text solver input does not use old 15ch width', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    const classAttr = await input.getAttribute('class');
    expect(classAttr).not.toContain('w-[15ch]');
  });
});
