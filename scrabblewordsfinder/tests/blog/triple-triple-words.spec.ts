import { test, expect } from '@playwright/test';

const PAGE = '/blog/triple-triple-words/';

test.describe('Triple-Triple Words Blog — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.getByRole('heading', { name: /Triple-Triple Words in Scrabble/, level: 1 });
    await expect(h1).toBeVisible();
  });

  test('hero card displays TRIPLE-TRIPLE with 9× multiplier details', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard.locator('text=TRIPLE-TRIPLE')).toBeVisible();
    await expect(heroCard.locator('text=9× multiplier')).toBeVisible();
    await expect(heroCard.locator('text=Legendary Play')).toBeVisible();
  });

  test('9× multiplier stat strip shows the math (×3 × ×3 = ×9)', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    const timesThree = statStrip.locator('text=×3');
    expect(await timesThree.count()).toBe(2);
    await expect(statStrip.locator('text=×9')).toBeVisible();
  });

  test('Key Rule insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(callout).toBeVisible();
    await expect(callout.locator('text=Key Rule')).toBeVisible();
  });

  test('famous triple-triple table shows CAZIQUES, QUIXOTRY, OXAZEPAM, BEZIQUES', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    for (const word of ['CAZIQUES', 'QUIXOTRY', 'OXAZEPAM', 'BEZIQUES']) {
      await expect(table.locator(`text=${word}`)).toBeVisible();
    }
  });

  test('pill badges show word scores for famous plays', async ({ page }) => {
    await page.goto(PAGE);
    const badgeContainer = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3');
    await expect(badgeContainer.first()).toBeVisible();
    await expect(page.locator('.text-blue-400.text-xs:has-text("392 pts")')).toBeVisible();
    await expect(page.locator('.text-blue-400.text-xs:has-text("365 pts")')).toBeVisible();
    await expect(page.locator('.text-blue-400.text-xs:has-text("356 pts")')).toBeVisible();
  });

  test('setup strategy section shows 4 numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    const strategyCard = page.locator('.border-purple-500\\/30.bg-purple-950\\/10');
    await expect(strategyCard).toBeVisible();
    await expect(strategyCard.locator('text=Setup Strategy')).toBeVisible();
    const steps = strategyCard.locator('.rounded-full');
    expect(await steps.count()).toBe(4);
  });

  test('rarity section shows 4 reason cards', async ({ page }) => {
    await page.goto(PAGE);
    const reasonCards = page.locator('.border-red-500\\/30.bg-red-950\\/10');
    expect(await reasonCards.count()).toBe(4);
  });

  test('probability stat strip shows ~0.3% games stat', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip.locator('text=~0.3%')).toBeVisible();
    await expect(statStrip.locator('text=8')).toBeVisible();
    await expect(statStrip.locator('text=4')).toBeVisible();
  });

  test('example score calculations section shows 3 word cards', async ({ page }) => {
    await page.goto(PAGE);
    const wordCards = page.locator('.border-gray-700.bg-gray-800\\/40');
    expect(await wordCards.count()).toBe(3);
    await expect(page.locator('text=QUIXOTRY').first()).toBeVisible();
    await expect(page.locator('text=CAZIQUES').first()).toBeVisible();
    await expect(page.locator('text=MAXIMIZE')).toBeVisible();
  });

  test('realistic expectation callout mentions STRANGE', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    await expect(callout).toBeVisible();
    await expect(callout.locator('text=Realistic Expectation')).toBeVisible();
    await expect(callout.locator('text=STRANGE')).toBeVisible();
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

  test('breadcrumb navigation includes Blog and High Scoring links', async ({ page }) => {
    await page.goto(PAGE);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/high-scoring/"]')).toBeVisible();
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
      if (text && text.includes('"@type":"Article"') && text.includes('Triple-Triple')) {
        articleSchema = JSON.parse(text);
        break;
      }
    }
    expect(articleSchema).not.toBeNull();
    expect(articleSchema['@type']).toBe('Article');
    expect(articleSchema.headline).toContain('Triple-Triple');
  });

  test('Dig Deeper cross-links section has internal links', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('text=Dig Deeper')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/understanding-premium-squares/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/oxyphenbutazone-highest-scoring-word/"]')).toBeVisible();
  });
});

test.describe('Triple-Triple Words Blog — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements in article content', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    const count = await h1s.count();
    expect(count).toBe(1);
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

  test('table header row exists with correct columns', async ({ page }) => {
    await page.goto(PAGE);
    const headers = page.locator('thead th');
    const texts = await headers.allTextContents();
    expect(texts).toContain('Player');
    expect(texts).toContain('Word');
    expect(texts).toContain('Score');
    expect(texts).toContain('Context');
  });

  test('rarity reason cards each have a title and description', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.border-red-500\\/30.bg-red-950\\/10');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const title = card.locator('.text-red-400.font-semibold');
      await expect(title).toBeVisible();
      const desc = card.locator('.text-xs.text-gray-400');
      await expect(desc).toBeVisible();
      const descText = await desc.textContent();
      expect(descText!.trim().length).toBeGreaterThan(10);
    }
  });

  test('page does not contain broken image references', async ({ page }) => {
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
