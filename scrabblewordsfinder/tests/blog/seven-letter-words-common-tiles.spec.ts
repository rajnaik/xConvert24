import { test, expect } from '@playwright/test';

const PAGE = '/blog/seven-letter-words-with-common-tiles/';

test.describe('Seven-Letter Words with Common Tiles — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.getByRole('heading', { name: /Seven-Letter Words with Common Tiles/, level: 1 });
    await expect(h1).toBeVisible();
  });

  test('hero card displays COMMON TILES = COMMON BINGOS', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard.locator('text=COMMON TILES = COMMON BINGOS')).toBeVisible();
    await expect(heroCard.locator('text=10 letters that make up 70% of your draws')).toBeVisible();
  });

  test('tile frequency stat strip shows E x12 and other counts', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip.locator('text=E ×12')).toBeVisible();
    await expect(statStrip.locator('text=A ×9')).toBeVisible();
    await expect(statStrip.locator('text=O ×8')).toBeVisible();
  });

  test('pill badges show all 10 common tile letters', async ({ page }) => {
    await page.goto(PAGE);
    const pillSection = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3').first();
    await expect(pillSection).toBeVisible();
    for (const letter of ['E', 'A', 'I', 'O', 'N', 'R', 'T', 'L', 'S', 'D']) {
      await expect(pillSection.locator(`text=${letter}`).first()).toBeVisible();
    }
  });

  test('Why This Matters insight callout is present', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toBeVisible();
    await expect(callout.locator('text=Why This Matters for Bingos')).toBeVisible();
    await expect(callout.locator('text=68 of 98 letter tiles')).toBeVisible();
  });

  test('Top 20 Common-Tile Bingos table is visible with header row', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('th:has-text("#")')).toBeVisible();
    await expect(table.locator('th:has-text("Word")')).toBeVisible();
    await expect(table.locator('th:has-text("Letters Used")')).toBeVisible();
    await expect(table.locator('th:has-text("Stem Family")')).toBeVisible();
  });

  test('Top 20 table has exactly 20 data rows', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    expect(await rows.count()).toBe(20);
  });

  test('Top 20 table contains key bingo words', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table.locator('text=RETINAS')).toBeVisible();
    await expect(table.locator('text=NASTIER')).toBeVisible();
    await expect(table.locator('text=SARDINE')).toBeVisible();
    await expect(table.locator('text=SENATOR')).toBeVisible();
    await expect(table.locator('text=TREASON')).toBeVisible();
  });

  test('Top 20 table shows stem families for each word', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table.locator('text=RETINA +S')).toBeVisible();
    await expect(table.locator('text=SATINE +R').first()).toBeVisible();
    await expect(table.locator('text=SATINE +D').first()).toBeVisible();
    await expect(table.locator('text=ORNATE +S').first()).toBeVisible();
  });

  test('Top 20 table first row is numbered 1 and last is 20', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const firstRow = table.locator('tbody tr').first();
    const lastRow = table.locator('tbody tr').last();
    await expect(firstRow.locator('td').first()).toContainText('1');
    await expect(lastRow.locator('td').first()).toContainText('20');
  });

  test('Grouped by Stem Family section has 4 stem cards', async ({ page }) => {
    await page.goto(PAGE);
    const stemCards = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    expect(await stemCards.count()).toBe(4);
    await expect(stemCards.first()).toContainText('SATINE Family');
  });

  test('Overlap Advantage insight callout is present', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    const overlapCallout = callouts.nth(1);
    await expect(overlapCallout).toBeVisible();
    await expect(overlapCallout.locator('text=Overlap Advantage')).toBeVisible();
  });

  test('breadcrumb navigation includes Blog and Bingos links', async ({ page }) => {
    await page.goto(PAGE);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/bingos/"]')).toBeVisible();
  });

  test('FAQPage structured data exists with 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let faqSchema: any = null;
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('FAQPage')) {
        faqSchema = JSON.parse(text);
        break;
      }
    }
    expect(faqSchema).not.toBeNull();
    expect(faqSchema['@type']).toBe('FAQPage');
    expect(faqSchema.mainEntity).toHaveLength(3);
  });

  test('Article structured data exists with correct headline', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let articleSchema: any = null;
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('"Article"')) {
        articleSchema = JSON.parse(text);
        break;
      }
    }
    expect(articleSchema).not.toBeNull();
    expect(articleSchema['@type']).toBe('Article');
    expect(articleSchema.headline).toContain('Seven-Letter Words with Common Tiles');
  });
});

test.describe('Seven-Letter Words with Common Tiles — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    expect(await h1s.count()).toBe(1);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-2.border-amber-500\\/50');
    expect(await heroCards.count()).toBe(1);
  });

  test('Top 20 table has no duplicate word entries', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const wordCells = table.locator('tbody tr td:nth-child(2)');
    const count = await wordCells.count();
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await wordCells.nth(i).textContent();
      words.push(text?.trim() || '');
    }
    const uniqueWords = new Set(words);
    expect(uniqueWords.size, 'Table should not have duplicate words').toBe(words.length);
  });

  test('Top 20 table words use only common tiles (E A I O N R T L S D)', async ({ page }) => {
    await page.goto(PAGE);
    const allowedLetters = new Set('EAIONRTLSD'.split(''));
    const table = page.locator('table').first();
    const wordCells = table.locator('tbody tr td:nth-child(2)');
    const count = await wordCells.count();
    const violations: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await wordCells.nth(i).textContent())?.trim() || '';
      for (const char of text) {
        if (char !== ' ' && !allowedLetters.has(char)) {
          violations.push(`${text} contains '${char}'`);
          break;
        }
      }
    }
    expect(violations, `Words with non-common tiles: ${violations.join(', ')}`).toHaveLength(0);
  });

  test('no duplicate FAQPage schemas', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let faqCount = 0;
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('FAQPage')) faqCount++;
    }
    expect(faqCount).toBe(1);
  });

  test('no empty href attributes on any link', async ({ page }) => {
    await page.goto(PAGE);
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('FAQ answers are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('FAQPage')) {
        const schema = JSON.parse(text);
        for (const entity of schema.mainEntity) {
          expect(entity.acceptedAnswer.text.length).toBeGreaterThan(20);
        }
      }
    }
  });

  test('table rows alternate background colors correctly', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    const firstRowClass = await rows.first().getAttribute('class');
    const secondRowClass = await rows.nth(1).getAttribute('class');
    expect(firstRowClass).not.toBe(secondRowClass);
  });
});
