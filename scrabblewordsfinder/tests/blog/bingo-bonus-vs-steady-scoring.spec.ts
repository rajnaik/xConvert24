import { test, expect } from '@playwright/test';

const PAGE = '/blog/bingo-bonus-vs-steady-scoring/';

test.describe('Bingo Bonus vs Steady Scoring — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.getByRole('heading', { name: /Bingo Bonus vs Steady Scoring in Scrabble/, level: 1 });
    await expect(h1).toBeVisible();
  });

  test('hero card displays core trade-off with 50 POINTS vs 3 TURNS', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard.locator('text=50 POINTS vs 3 TURNS')).toBeVisible();
    await expect(heroCard.locator('text=The Core Trade-off')).toBeVisible();
  });

  test('math section stat strip shows turns, steady average, and bingo bonus', async ({ page }) => {
    await page.goto(PAGE);
    const statStrips = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    const firstStrip = statStrips.first();
    await expect(firstStrip).toBeVisible();
    await expect(firstStrip.locator('text=Turns per game')).toBeVisible();
    await expect(firstStrip.locator('text=35 pts')).toBeVisible();
    await expect(firstStrip.locator('text=+50')).toBeVisible();
  });

  test('Key Insight callout about opportunity cost is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toBeVisible();
    await expect(callout.locator('text=Key Insight')).toBeVisible();
    await expect(callout.locator('text=opportunity cost')).toBeVisible();
  });

  test('chase vs dont chase comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const chaseCard = page.locator('.border-green-500\\/30.bg-green-950\\/10').first();
    const dontChaseCard = page.locator('.border-red-500\\/30.bg-red-950\\/10').first();
    await expect(chaseCard).toBeVisible();
    await expect(chaseCard.locator('text=Chase the Bingo')).toBeVisible();
    await expect(dontChaseCard).toBeVisible();
    await expect(dontChaseCard.locator("text=Don't Chase")).toBeVisible();
  });

  test('purple strategy tiles show One-Away Rule, Blank = Bingo, Board Awareness', async ({ page }) => {
    await page.goto(PAGE);
    const purpleTiles = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    expect(await purpleTiles.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('text=The One-Away Rule:')).toBeVisible();
    await expect(page.locator('text=Blank = Bingo:')).toBeVisible();
    await expect(page.locator('text=Board Awareness:')).toBeVisible();
  });

  test('Dig Deeper cross-links section has internal links', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('text=Dig Deeper')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/rack-management-basics/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/bingo-stem-strategy/"]')).toBeVisible();
  });

  test('steady scoring framework shows 4 numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    const frameworkCard = page.locator('.border-purple-500\\/30.bg-purple-950\\/10');
    await expect(frameworkCard).toBeVisible();
    await expect(page.locator('text=Steady Scoring Framework')).toBeVisible();
    const steps = frameworkCard.locator('.rounded-full');
    expect(await steps.count()).toBe(4);
  });

  test('three game scenarios are displayed with verdicts', async ({ page }) => {
    await page.goto(PAGE);
    const scenarios = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    expect(await scenarios.count()).toBe(3);
    await expect(page.locator('text=Scenario 1')).toBeVisible();
    await expect(page.locator('text=Scenario 2')).toBeVisible();
    await expect(page.locator('text=Scenario 3')).toBeVisible();
    await expect(page.locator('text=Verdict:').first()).toBeVisible();
  });

  test('3-Turn Rule callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    let foundThreeTurn = false;
    const count = await callouts.count();
    for (let i = 0; i < count; i++) {
      const text = await callouts.nth(i).textContent();
      if (text?.includes('3-Turn Rule')) {
        foundThreeTurn = true;
        break;
      }
    }
    expect(foundThreeTurn).toBe(true);
  });

  test('pill badges show bag thresholds (30+, 15-30, <15, Blank drawn)', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=Bag 30+')).toBeVisible();
    await expect(page.locator('text=Bag 15-30')).toBeVisible();
    await expect(page.locator('text=Blank drawn')).toBeVisible();
    await expect(page.locator('.text-blue-400.text-xs:has-text("bingo ok")')).toBeVisible();
    await expect(page.locator('.text-red-400.text-xs:has-text("go steady")')).toBeVisible();
  });

  test('related articles section has 3 cross-links', async ({ page }) => {
    await page.goto(PAGE);
    const relatedSection = page.locator('aside');
    await expect(relatedSection).toBeVisible();
    const relatedLinks = relatedSection.locator('a[href^="/blog/"]');
    expect(await relatedLinks.count()).toBe(3);
  });

  test('CTA box with Word Finder link is present', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(cta).toBeVisible();
    await expect(cta.locator('a[href="/"]')).toBeVisible();
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
    expect(articleSchema.headline).toContain('Bingo Bonus vs Steady Scoring');
  });
});

test.describe('Bingo Bonus vs Steady Scoring — Negative', () => {

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

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    expect(await selfLinks.count()).toBe(0);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto(PAGE);
    const links = await page.locator('a[href^="/"]').all();
    const missingSlash: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.endsWith('/') && !href.includes('#') && !href.includes('?')) {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Links missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no empty href attributes on any link', async ({ page }) => {
    await page.goto(PAGE);
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('scenarios each have a verdict section', async ({ page }) => {
    await page.goto(PAGE);
    const scenarios = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    const count = await scenarios.count();
    expect(count).toBe(3);
    for (let i = 0; i < count; i++) {
      const scenario = scenarios.nth(i);
      const verdictText = await scenario.locator('.text-cyan-300').textContent();
      expect(verdictText?.trim().length, `Scenario ${i + 1} missing verdict`).toBeGreaterThan(0);
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

  test('no broken image references on page', async ({ page }) => {
    await page.goto(PAGE);
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        expect(src.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
