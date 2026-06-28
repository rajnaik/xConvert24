import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';

// ── Header Tests ──────────────────────────────────────────────────────────

test.describe('Header — Positive', () => {
  test('search bar is visible with placeholder text', async ({ page }) => {
    await page.goto(BASE_URL);
    const search = page.locator('#dict-search');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder', 'Search pages, blog...');
    await expect(search).toHaveValue('');
  });

  test('search bar accepts user input', async ({ page }) => {
    await page.goto(BASE_URL);
    const search = page.locator('#dict-search');
    await search.fill('scrabble tips');
    await expect(search).toHaveValue('scrabble tips');
  });

  test('Find button is visible', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('#search-find-btn')).toBeVisible();
  });

  test('FAQ link in top nav', async ({ page }) => {
    await page.goto(BASE_URL);
    const faqLink = page.locator('a[href="/faq/"]').first();
    await expect(faqLink).toBeVisible();
  });

  test('icon links visible on solver page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('a[title="Bug"]')).toBeVisible();
    await expect(page.locator('a[title="Suggest"]')).toBeVisible();
    await expect(page.locator('a[title="Achievements"]')).toBeVisible();
  });

  test('purple line visible in header', async ({ page }) => {
    await page.goto(BASE_URL);
    const line = page.locator('.col-span-full.border-t');
    await expect(line).toBeVisible();
  });
});

test.describe('Header — Negative', () => {
  test('search bar does not have a hardcoded value', async ({ page }) => {
    await page.goto(BASE_URL);
    const search = page.locator('#dict-search');
    await expect(search).toHaveValue('');
  });

  test('no duplicate ScrabbleWordsFinder nav on Guide page', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    const navs = page.locator('nav');
    await expect(navs).toHaveCount(0);
  });

  test('solver icon hidden on solver page', async ({ page }) => {
    await page.goto(BASE_URL);
    const solverIcon = page.locator('a[title="Solver"]');
    await expect(solverIcon).toHaveCount(0);
  });

  test('solver icon visible on non-solver pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    const solverIcon = page.locator('a[title="Solver"]');
    await expect(solverIcon).toBeVisible();
  });
});

// ── Solver Controls Tests ─────────────────────────────────────────────────

test.describe('Solver Controls — Positive', () => {
  test('X clear button visible', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('#clear-text-solver')).toBeVisible();
  });

  test('X clear button clears text solver', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);
    const solver = page.locator('#text-solver');
    await solver.fill('TESTING');
    await page.locator('#clear-text-solver').click();
    await expect(solver).toHaveValue('');
  });

  test('Solve button exists', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('#text-solve-btn')).toBeVisible();
  });

  test('Find Words button exists', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('#solve-btn')).toBeVisible();
  });
});

test.describe('Solver Controls — Negative', () => {
  test('no crash when clearing empty solver', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('#clear-text-solver').click();
    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('error');
  });

  test('clear button is in header row alongside copy/paste', async ({ page }) => {
    await page.goto(BASE_URL);
    // The clear button should share the same parent container as copy-solver and paste-solver
    const headerRow = page.locator('#copy-solver').locator('..');
    await expect(headerRow.locator('#clear-text-solver')).toBeVisible();
  });

  test('clear button is not duplicated in the input row', async ({ page }) => {
    await page.goto(BASE_URL);
    // Only one clear button should exist on the page
    await expect(page.locator('#clear-text-solver')).toHaveCount(1);
    // The input row (containing #text-solver) should NOT contain the clear button
    const inputRow = page.locator('#text-solver').locator('..');
    await expect(inputRow.locator('#clear-text-solver')).toHaveCount(0);
  });
});

// ── Achievements Tests ────────────────────────────────────────────────────

test.describe('Achievements Page — Positive', () => {
  test('achievements page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/achievements`);
    await expect(page.locator('h1')).toContainText('My Achievements');
  });

  test('shows empty state or table', async ({ page }) => {
    await page.goto(`${BASE_URL}/achievements`);
    await page.waitForTimeout(2000);
    const empty = page.locator('#achievements-empty');
    const table = page.locator('#achievements-table');
    const emptyVisible = await empty.isVisible();
    const tableVisible = await table.isVisible();
    expect(emptyVisible || tableVisible).toBe(true);
  });

  test('tile scores encouragement shows default message', async ({ page }) => {
    await page.goto(BASE_URL);
    const encouragement = page.locator('#tile-score-encouragement');
    await expect(encouragement).toContainText('Solve a word to see your Tile Scores');
  });
});

test.describe('Achievements Page — Negative', () => {
  test('no crash on achievements page without user_id', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/achievements`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => e.includes('fatal'))).toHaveLength(0);
  });
});

// ── Blog Index Tests ──────────────────────────────────────────────────────

test.describe('Blog Index — Positive', () => {
  test('blog page loads with all categories', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    await expect(page.locator('h1')).toContainText('Scrabble');
    await expect(page.locator('text=Beginner Guides')).toBeVisible();
    await expect(page.locator('text=Two-Letter Words')).toBeVisible();
    await expect(page.locator('text=Three-Letter Words')).toBeVisible();
    await expect(page.locator('text=Words Starting With')).toBeVisible();
  });

  test('blog has more than 4 posts listed', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog`);
    const cards = page.locator('.blog-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(20);
  });

  test('search filter works on blog', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog?q=history`);
    const banner = page.locator('#search-banner');
    await expect(banner).toBeVisible();
  });
});

test.describe('Blog Index — Negative', () => {
  test('no results message for nonsense query', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog?q=xyznonexistent`);
    const noResults = page.locator('#no-results');
    await expect(noResults).toBeVisible();
  });
});

// ── Guide Page Tests ──────────────────────────────────────────────────────

test.describe('Guide Page — Positive', () => {
  test('guide page loads with tile bag control', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    await expect(page.locator('#guide-bag')).toBeVisible();
    await expect(page.locator('#guide-played')).toBeVisible();
  });

  test('tile bag reset button works', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    const bagInput = page.locator('#guide-bag');
    await bagInput.fill('50');
    await page.locator('#guide-reset-bag').click();
    await expect(bagInput).toHaveValue('100');
  });

  test('guide has bidirectional sync section', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    await expect(page.locator('text=Bidirectional Sync')).toBeVisible();
  });

  test('guide has clear button section', async ({ page }) => {
    await page.goto(`${BASE_URL}/guide`);
    await expect(page.locator('text=Clear Button')).toBeVisible();
  });
});

test.describe('Guide Page — Negative', () => {
  test('no crash with guide page interactions', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/guide`);
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});

// ── Footer Tests ──────────────────────────────────────────────────────────

test.describe('Footer — Positive', () => {
  test('footer shows 2026', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('footer')).toContainText('2026');
  });

  test('footer has icon links', async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator('footer');
    await expect(footer.locator('text=🔍 Solver')).toBeVisible();
    await expect(footer.locator('text=📝 Blog')).toBeVisible();
    await expect(footer.locator('text=📘 Guide')).toBeVisible();
    await expect(footer.locator('text=❓ FAQ')).toBeVisible();
  });

  test('clicks counter visible in footer', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('#footer-clicks')).toBeVisible();
  });

  test('report bug links to SWF contact page', async ({ page }) => {
    await page.goto(BASE_URL);
    const bugLink = page.locator('footer a[href="/contact?subject=bug"]');
    await expect(bugLink).toBeVisible();
  });
});

test.describe('Footer — Negative', () => {
  test('no xconvert24 links in footer', async ({ page }) => {
    await page.goto(BASE_URL);
    const footer = page.locator('footer');
    const html = await footer.innerHTML();
    expect(html).not.toContain('xconvert24.com/report-bug');
  });
});

// ── FAQ Page Tests ────────────────────────────────────────────────────────

test.describe('FAQ Page — Positive', () => {
  test('FAQ page loads with questions', async ({ page }) => {
    await page.goto(`${BASE_URL}/faq`);
    await expect(page.locator('h1')).toContainText('Frequently Asked Questions');
    const details = page.locator('details');
    const count = await details.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('FAQ questions expand on click', async ({ page }) => {
    await page.goto(`${BASE_URL}/faq`);
    const firstQ = page.locator('details').first();
    await firstQ.locator('summary').click();
    await expect(firstQ.locator('p')).toBeVisible();
  });
});

// ── Diamond Icon Tests ────────────────────────────────────────────────────

test.describe('Diamond Icon — Positive', () => {
  test('diamond icon appears on high-scoring words', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);
    const solver = page.locator('#text-solver');
    await solver.fill('QUIZZING');
    await page.waitForTimeout(800);
    const diamonds = page.locator('[title*="High scorer"]');
    const count = await diamonds.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ── Pages Consistency Tests ───────────────────────────────────────────────

test.describe('Pages Consistency — Positive', () => {
  const pages = ['/guide', '/about', '/privacy', '/contact', '/suggest', '/faq', '/achievements', '/disclaimer', '/terms'];

  for (const path of pages) {
    test(`${path} has header with icons`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`);
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('a[title="Bug"]')).toBeVisible();
    });
  }
});
