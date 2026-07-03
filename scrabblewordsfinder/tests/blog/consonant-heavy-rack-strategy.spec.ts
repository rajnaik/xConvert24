import { test, expect } from '@playwright/test';

const PAGE = '/blog/consonant-heavy-rack-strategy/';

test.describe('Consonant-Heavy Rack Strategy — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1.text-3xl.font-bold.mb-4');
    await expect(h1).toContainText('Consonant-Heavy Rack Strategy');
  });

  test('breadcrumb links to blog index and strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav[aria-label="Breadcrumb"] a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    const strategyLink = page.locator('nav[aria-label="Breadcrumb"] a[href="/blog/strategy/"]');
    await expect(strategyLink).toBeVisible();
  });

  test('article meta shows date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-15"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=6 min read');
    await expect(readTime).toBeVisible();
  });

  test('lead paragraph mentions BCDGKRT example rack', async ({ page }) => {
    await page.goto(PAGE);
    const lead = page.locator('p.text-lg.leading-relaxed').first();
    await expect(lead).toContainText('BCDGKRT');
  });

  test('What Makes a Rack Consonant-Heavy h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("What Makes a Rack Consonant-Heavy")');
    await expect(h2).toBeVisible();
  });

  test('rack balance visual grid shows Balanced, Heavy, and Critical', async ({ page }) => {
    await page.goto(PAGE);
    const balanced = page.locator('text=3C : 4V');
    await expect(balanced).toBeVisible();
    const heavy = page.locator('text=5C : 2V');
    await expect(heavy).toBeVisible();
    const critical = page.locator('text=6-7C : 0-1V');
    await expect(critical).toBeVisible();
  });

  test('Best Consonant-Rich Words table is visible with CRWTH', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Best Consonant-Rich Words to Know")');
    await expect(h2).toBeVisible();
    const table = page.locator('table').first();
    await expect(table).toContainText('CRWTH');
    await expect(table).toContainText('LYMPH');
    await expect(table).toContainText('NYMPH');
    await expect(table).toContainText('PSYCH');
    await expect(table).toContainText('GLYPH');
  });

  test('strategy tile about Y as lifeline is visible', async ({ page }) => {
    await page.goto(PAGE);
    const stratTile = page.locator('text=Y is your lifeline in consonant-heavy racks');
    await expect(stratTile).toBeVisible();
  });

  test('Exchange vs Play Through decision framework section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Exchange vs Play Through")');
    await expect(h2).toBeVisible();
  });

  test('play through green card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const playCard = page.locator('.bg-green-50, .dark\\:bg-green-900\\/20').filter({ hasText: 'Play through when' });
    await expect(playCard).toBeVisible();
    await expect(playCard).toContainText('15+ points');
  });

  test('exchange red card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const exchangeCard = page.locator('.bg-red-50, .dark\\:bg-red-900\\/20').filter({ hasText: 'Exchange when' });
    await expect(exchangeCard).toBeVisible();
    await expect(exchangeCard).toContainText('under 10 points');
  });

  test('Consonant Dumping Techniques h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Consonant Dumping Techniques")');
    await expect(h2).toBeVisible();
  });

  test('numbered technique steps are visible (4 steps)', async ({ page }) => {
    await page.goto(PAGE);
    const steps = page.locator('ol li');
    const count = await steps.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('High-Value Consonant Combinations h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("High-Value Consonant Combinations")');
    await expect(h2).toBeVisible();
  });

  test('consonant combination pill badges are visible', async ({ page }) => {
    await page.goto(PAGE);
    const pills = page.locator('.rounded-full').filter({ hasText: /^(ST|SH|TH|CH|GH|PH|CR|SP)/ });
    const count = await pills.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('second table with consonant-heavy words shows STRENGTHS', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table');
    const secondTable = tables.nth(1);
    await expect(secondTable).toContainText('STRENGTHS');
    await expect(secondTable).toContainText('SCRUNCH');
    await expect(secondTable).toContainText('SCHNAPPS');
  });

  test('Preventing Consonant-Heavy Racks h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Preventing Consonant-Heavy Racks")');
    await expect(h2).toBeVisible();
  });

  test('Good Leave vs Bad Leave comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const goodCard = page.locator('text=Good Leave').first();
    await expect(goodCard).toBeVisible();
    const badCard = page.locator('text=Bad Leave').first();
    await expect(badCard).toBeVisible();
  });

  test('Related Articles aside section with links exists', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r').filter({ hasText: 'Find the best words from any rack' });
    await expect(cta).toBeVisible();
    const ctaLink = cta.locator('a[href="/"]');
    await expect(ctaLink).toContainText('Try the Word Finder');
  });

  test('Back to Blog link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a[href="/blog/"]').filter({ hasText: 'Back to Blog' });
    await expect(backLink).toBeVisible();
  });

  test('Related Reading cross-links are visible', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('text=Related Reading').first();
    await expect(crossLinks).toBeVisible();
  });

  test('FAQPage schema is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });
});

test.describe('Consonant-Heavy Rack Strategy — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate page h1 headings', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1.text-3xl.font-bold.mb-4');
    await expect(h1s).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('JSON-LD structured data has at least 2 scripts (Article + FAQ)', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r').filter({ hasText: 'Find the best words from any rack' });
    await expect(ctas).toHaveCount(1);
  });

  test('no duplicate Related Articles aside sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });

  test('Related Articles links do not 404', async ({ page, request }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href) {
        const resp = await request.get(href);
        expect(resp.status(), `Link ${href} should not 404`).not.toBe(404);
      }
    }
  });

  test('no sensitive information exposed on page', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.textContent('body');
    expect(content).not.toContain('rajeev');
    expect(content).not.toContain('gmail');
    expect(content).not.toContain('api.key');
  });
});
