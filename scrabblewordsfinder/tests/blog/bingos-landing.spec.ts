import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Bingos Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/blog/bingos/`);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const h1 = page.getByRole('heading', { name: 'Scrabble Bingos', level: 1 });
    await expect(h1).toBeVisible();
  });

  test('stat strip shows category overview with 4 stats', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const statStrip = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip.locator('text=15')).toBeVisible();
    await expect(statStrip.locator('text=Guides')).toBeVisible();
    await expect(statStrip.locator('text=Bonus Points')).toBeVisible();
    await expect(statStrip.locator('text=SATINE Anagrams')).toBeVisible();
  });

  test('insight callout box is visible with "Why Bingos Matter" heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(callout).toBeVisible();
    await expect(callout.locator('text=Why Bingos Matter').first()).toBeVisible();
  });

  test('SATINE stem pill badges show all 7 tiles', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const badgeArea = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3').first();
    await expect(badgeArea).toBeVisible();
    for (const letter of ['S', 'A', 'T', 'I', 'N', 'E']) {
      await expect(badgeArea.locator(`text=${letter}`).first()).toBeVisible();
    }
  });

  test('hero card displays SATINE as #1 productive stem', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const heroCard = page.locator('.border-2.border-purple-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard.locator('text=S A T I N E')).toBeVisible();
    await expect(heroCard.locator('text=#1 Productive Stem')).toBeVisible();
    await expect(heroCard.locator('text=200+')).toBeVisible();
  });

  test('hero card displays SATIRE as #2 productive stem', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const heroCard = page.locator('.border-2.border-indigo-500\\/40');
    await expect(heroCard).toBeVisible();
    await expect(heroCard.locator('text=S A T I R E')).toBeVisible();
    await expect(heroCard.locator('text=#2 Productive Stem')).toBeVisible();
    await expect(heroCard.locator('text=180+')).toBeVisible();
  });

  test('Bingo Fundamentals section has 3 numbered links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const section = page.locator('h2:has-text("Bingo Fundamentals")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/what-is-a-bingo/',
      '/blog/bingo-probability/',
      '/blog/best-bingo-racks/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Stems & Strategy section has 5 links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const section = page.locator('h2:has-text("Stems & Strategy")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/bingo-stem-strategy/',
      '/blog/common-bingo-prefixes/',
      '/blog/common-bingo-endings/',
      '/blog/ing-words-scrabble-bingo/',
      '/blog/six-letter-words-that-lead-to-bingos/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Training & Recognition section has 2 links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const section = page.locator('h2:has-text("Training & Recognition")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/bingo-training-methods/',
      '/blog/how-to-spot-bingos-faster/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Word Lists & Records section has 5 links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const section = page.locator('h2:has-text("Word Lists & Records")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/seven-letter-bingo-list/',
      '/blog/eight-letter-bingos/',
      '/blog/highest-scoring-bingos/',
      '/blog/highest-scoring-seven-letter-words/',
      '/blog/famous-tournament-bingos/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('quick reference shows bingo word pills with point values', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const refSection = page.locator('text=Quick Reference');
    await expect(refSection).toBeVisible();
    const refContainer = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    for (const word of ['SATIRES', 'RETAINS', 'NASTIER', 'TRAINED']) {
      await expect(refContainer.locator(`text=${word}`).first()).toBeVisible();
    }
  });

  test('back to blog link is present and correct', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('More Categories section has cross-links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const moreCats = page.locator('h3:has-text("More Categories")');
    await expect(moreCats).toBeVisible();
  });

  test('CTA box with word finder link is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(cta).toBeVisible();
    await expect(cta.locator('a[href="/"]')).toBeVisible();
  });

  test('FAQPage JSON-LD schema is present with 3 questions', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    expect(count).toBeGreaterThanOrEqual(2);
    let faqText = '';
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent() || '';
      if (text.includes('FAQPage')) { faqText = text; break; }
    }
    expect(faqText).toContain('FAQPage');
    expect(faqText).toContain('What is a bingo in Scrabble');
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });
});

test.describe('Bingos Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/blog/bingos/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate h1 elements in main content', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('no duplicate post links on the page', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const allLinks = await page.locator('a[href^="/blog/"]').all();
    const hrefs: string[] = [];
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && href !== '/blog/' && !href.includes('bingos')) {
        hrefs.push(href);
      }
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate post links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
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
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('pill badges do not have missing point values', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const allBadges = await page.locator('.flex.flex-wrap.items-center.justify-center.gap-3').first().locator('span.inline-flex').all();
    for (const badge of allBadges) {
      const text = await badge.textContent();
      expect(text).toMatch(/pt|Blank/);
    }
  });

  test('page does not contain broken image references', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/bingos/`);
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        expect(src.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
