import { test, expect } from '@playwright/test';

/**
 * Tests for the Blog Index category navigation grid tiles.
 * The nav was changed from a flex-wrap pill layout to a grid of icon tiles
 * with per-category colour theming on 21 Jun 2026.
 * Tiles were further grouped into category sections with labels on 27 Jun 2026.
 */

const NAV_GRID = '.grid.grid-cols-3';

test.describe('Blog Index — Category Navigation Grid — Positive', () => {

  test('blog index page loads successfully', async ({ page }) => {
    const response = await page.goto('/blog/');
    expect(response?.status()).toBe(200);
  });

  test('category navigation grid is visible', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    await expect(navGrid).toBeVisible();
  });

  test('navigation grid uses responsive columns (sm:grid-cols-4, lg:grid-cols-5)', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const classes = await navGrid.getAttribute('class');
    expect(classes).toContain('sm:grid-cols-4');
    expect(classes).toContain('lg:grid-cols-5');
  });

  test('all 29 category/activity tiles are present', async ({ page }) => {
    await page.goto('/blog/');
    const expectedLabels = [
      'Beginner',
      'Strategy',
      'Tournament',
      'Pro Player',
      'Two-Letter',
      'Three-Letter',
      'Bingos',
      'High-Scoring',
      'Letter Guides',
      'Dictionaries',
      'Word Validity',
      'Thematic Words',
      'Containing',
      'Endings',
      'Prefixes',
      'Patterns',
      'Vocabulary',
      'Ask Lex AI',
      'Tools',
      'History',
      'Fun Facts',
      'Cheat Sheets',
      'WOTD Series',
      'Word Quiz',
      'WordBench',
      'Daily Rack',
      'Anagram',
      '60-Second',
      'Badges',
    ];
    const navGrid = page.locator(NAV_GRID).first();
    for (const label of expectedLabels) {
      const tile = navGrid.locator(`a:has-text("${label}")`);
      await expect(tile, `Tile "${label}" should be present`).toHaveCount(1);
    }
  });

  test('category group labels are present', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const groupLabels = ['Learn & Strategy', 'Word Lists', 'Word Validity & Themes', 'Word Patterns', 'Resources', 'Activities'];
    for (const label of groupLabels) {
      const groupHeader = navGrid.locator(`p.col-span-full:has-text("${label}")`);
      await expect(groupHeader, `Group label "${label}" should be present`).toHaveCount(1);
    }
  });

  test('each tile has an emoji icon and a text label', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const tiles = await navGrid.locator('a').all();
    expect(tiles.length).toBe(29);
    for (const tile of tiles) {
      // Each tile should have two spans: emoji icon + label text
      const spans = await tile.locator('span').count();
      expect(spans, 'Each tile should contain 2 spans (icon + label)').toBe(2);
    }
  });

  test('WOTD Series tile points to /blog/word-of-the-day-series/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("WOTD Series")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/blog/word-of-the-day-series/');
  });

  test('Pro Player tile points to /blog/roadmap-to-being-a-pro-player/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Pro Player")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/blog/roadmap-to-being-a-pro-player/');
  });

  test('Pro Player tile has yellow theming', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Pro Player")`).first();
    const classes = await tile.getAttribute('class');
    expect(classes).toContain('border-yellow-500/30');
    expect(classes).toContain('bg-yellow-950/20');
  });

  test('Word Quiz tile points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Word Quiz")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/activities/');
  });

  test('WordBench tile points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("WordBench")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/activities/');
  });

  test('Daily Rack tile points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Daily Rack")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/activities/');
  });

  test('Anagram tile points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Anagram")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/activities/');
  });

  test('60-Second tile points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("60-Second")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/activities/');
  });

  test('Cheat Sheets tile points to /cheat-sheets/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Cheat Sheets")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/cheat-sheets/');
  });

  test('Cheat Sheets tile has emerald theming', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Cheat Sheets")`).first();
    const classes = await tile.getAttribute('class');
    expect(classes).toContain('border-emerald-500/30');
    expect(classes).toContain('bg-emerald-950/20');
  });

  test('Ask Lex AI tile points to /chat/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Ask Lex AI")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/chat/');
  });

  test('Ask Lex AI tile has purple theming', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Ask Lex AI")`).first();
    const classes = await tile.getAttribute('class');
    expect(classes).toContain('border-purple-500/30');
    expect(classes).toContain('bg-purple-950/20');
  });

  test('Ask Lex AI tile has robot emoji icon', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Ask Lex AI")`).first();
    const emojiSpan = tile.locator('span').first();
    const text = await emojiSpan.textContent();
    expect(text?.trim()).toBe('🤖');
  });

  test('Word Validity tile points to /blog/word-validity/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Word Validity")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/blog/word-validity/');
  });

  test('Word Validity tile has violet theming', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Word Validity")`).first();
    const classes = await tile.getAttribute('class');
    expect(classes).toContain('border-violet-500/30');
    expect(classes).toContain('bg-violet-950/20');
  });

  test('Thematic Words tile points to /blog/thematic-words/', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Thematic Words")`).first();
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute('href', '/blog/thematic-words/');
  });

  test('Thematic Words tile has orange theming', async ({ page }) => {
    await page.goto('/blog/');
    const tile = page.locator(`${NAV_GRID} a:has-text("Thematic Words")`).first();
    const classes = await tile.getAttribute('class');
    expect(classes).toContain('border-orange-500/30');
    expect(classes).toContain('bg-orange-950/20');
  });

  test('blog category tiles use rounded-xl styling', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const firstTile = navGrid.locator('a').first();
    const classes = await firstTile.getAttribute('class');
    expect(classes).toContain('rounded-xl');
  });

  test('tiles have hover scale animation class on emoji', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const emojiSpan = navGrid.locator('a span').first();
    const classes = await emojiSpan.getAttribute('class');
    expect(classes).toContain('group-hover:scale-110');
  });

  test('Useful Links collapsible panel is present below nav grid', async ({ page }) => {
    await page.goto('/blog/');
    const panel = page.locator('#useful-links-panel');
    await expect(panel).toBeVisible();
  });
});

test.describe('Blog Index — Category Navigation Grid — Negative', () => {

  test('no duplicate category tiles', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const labels = await navGrid.locator('a span.text-xs').allTextContents();
    const trimmed = labels.map(t => t.trim());
    const duplicates = trimmed.filter((item, index) => trimmed.indexOf(item) !== index);
    expect(duplicates, `Duplicate tiles found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('no tiles have empty href', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const allTiles = await navGrid.locator('a').all();
    for (const tile of allTiles) {
      const href = await tile.getAttribute('href');
      expect(href, 'Tile should not have empty href').toBeTruthy();
      expect(href?.trim().length, 'Tile href should not be empty string').toBeGreaterThan(0);
    }
  });

  test('no tile hrefs have broken paths (must start with /)', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const allTiles = await navGrid.locator('a').all();
    for (const tile of allTiles) {
      const href = await tile.getAttribute('href');
      expect(href?.startsWith('/'), `Tile href "${href}" should start with /`).toBe(true);
    }
  });

  test('all blog category tiles have trailing slash', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const allTiles = await navGrid.locator('a').all();
    const missingSlash: string[] = [];
    for (const tile of allTiles) {
      const href = await tile.getAttribute('href');
      if (href && !href.endsWith('/')) {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Tiles missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no console errors on blog index page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('critical') || e.includes('TypeError'))).toHaveLength(0);
  });

  test('old flex-wrap pill navigation container no longer exists', async ({ page }) => {
    await page.goto('/blog/');
    const oldNav = page.locator('.flex.flex-wrap.gap-2.mb-6');
    await expect(oldNav).toHaveCount(0);
  });

  test('each tile has exactly one border color class (no mixed theming)', async ({ page }) => {
    await page.goto('/blog/');
    const navGrid = page.locator(NAV_GRID).first();
    const allTiles = await navGrid.locator('a').all();
    for (const tile of allTiles) {
      const classes = await tile.getAttribute('class') || '';
      const borderColors = classes.split(' ').filter(c => c.startsWith('border-') && c.includes('/'));
      // Each tile should have exactly one themed border color (e.g. border-blue-500/30)
      expect(borderColors.length, `Tile should have exactly one border color class, found: ${borderColors.join(', ')}`).toBe(1);
    }
  });

  test('Useful Links panel collapses on second click', async ({ page }) => {
    await page.goto('/blog/');
    const toggle = page.locator('#useful-links-toggle');
    const content = page.locator('#useful-links-content');
    await toggle.click();
    await expect(content).toBeVisible();
    await toggle.click();
    await expect(content).toBeHidden();
  });

  test('Useful Links panel links all start with /', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const panelLinks = await page.locator('#useful-links-content a').all();
    for (const link of panelLinks) {
      const href = await link.getAttribute('href');
      expect(href?.startsWith('/'), `Panel link href "${href}" should start with /`).toBe(true);
    }
  });
});
