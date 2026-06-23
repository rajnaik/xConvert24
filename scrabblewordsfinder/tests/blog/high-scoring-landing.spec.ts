import { test, expect } from '@playwright/test';

test.describe('High-Scoring Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/high-scoring/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const h1 = page.getByRole('heading', { name: 'High-Scoring Scrabble Words', level: 1 });
    await expect(h1).toBeVisible();
  });

  test('stat strip shows category overview with 4 stats', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip.locator('text=11')).toBeVisible();
    await expect(statStrip.locator('text=Guides')).toBeVisible();
    await expect(statStrip.locator('text=Power Letters')).toBeVisible();
    await expect(statStrip.locator('text=Max Theoretical Score')).toBeVisible();
  });

  test('insight callout box is visible with "Why This Matters" heading', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const callout = page.locator('text=Why This Matters');
    await expect(callout).toBeVisible();
  });

  test('power tile pill badges show Q, Z, X, J, K', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const badges = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3').first();
    await expect(badges).toBeVisible();
    for (const letter of ['Q', 'Z', 'X', 'J', 'K']) {
      await expect(badges.locator(`text=${letter}`).first()).toBeVisible();
    }
  });

  test('hero card displays OXYPHENBUTAZONE with record details', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const heroCard = page.locator('text=OXYPHENBUTAZONE').first();
    await expect(heroCard).toBeVisible();
    const container = page.locator('.border-2.border-amber-500\\/50');
    await expect(container.locator('text=All-Time Record')).toBeVisible();
    await expect(container.locator('text=1,778 points')).toBeVisible();
  });

  test('Power Letter Guides section has 4 links (Q, Z, X, J)', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const section = page.locator('h2:has-text("Power Letter Guides")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/best-q-words-scrabble/',
      '/blog/best-z-words-scrabble/',
      '/blog/best-x-words-scrabble/',
      '/blog/best-j-words-scrabble/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Scoring Records section has 3 links', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const section = page.locator('h2:has-text("Scoring Records & Analysis")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/highest-scoring-scrabble-words/',
      '/blog/high-scoring-short-words/',
      '/blog/oxyphenbutazone-highest-scoring-word/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Best Words by Length section has 4 links (5-5-6-7)', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const section = page.locator('h2:has-text("Best Words by Length")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/five-letter-power-words/',
      '/blog/highest-scoring-five-letter-words/',
      '/blog/highest-scoring-six-letter-words/',
      '/blog/highest-scoring-seven-letter-words/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('quick scoring reference shows word pills with point values', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const refSection = page.locator('text=Quick Scoring Reference');
    await expect(refSection).toBeVisible();
    const refContainer = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    for (const word of ['QI', 'ZA', 'ZO', 'AX', 'XI', 'ZAX', 'ZEK']) {
      await expect(refContainer.locator(`text=${word}`).first()).toBeVisible();
    }
  });

  test('Related articles section contains new scoring analysis links', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const newLinks = [
      '/blog/short-words-high-point-values/',
      '/blog/long-words-low-point-values/',
      '/blog/words-worth-over-20-points/',
      '/blog/words-worth-over-30-points/',
      '/blog/words-worth-over-40-points/',
    ];
    for (const href of newLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('More Categories section with cross-links is present', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const moreCats = page.locator('h3:has-text("More Categories")');
    await expect(moreCats).toBeVisible();
  });

  test('back to blog link is present and correct', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('CTA box with word finder link is present', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(cta).toBeVisible();
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });
});

test.describe('High-Scoring Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/high-scoring/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate h1 elements in main content', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('no duplicate post links on the page', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const allLinks = await page.locator('a[href^="/blog/"]').all();
    const hrefs: string[] = [];
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && href !== '/blog/' && !href.includes('high-scoring')) {
        hrefs.push(href);
      }
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate post links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
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
    await page.goto('/blog/high-scoring/');
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('power letter badges do not have missing point values', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const badges = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3 span.inline-flex').first();
    // Each badge should contain both a letter and a "pts" label
    const allBadges = await page.locator('.flex.flex-wrap.items-center.justify-center.gap-3').first().locator('span.inline-flex').all();
    for (const badge of allBadges) {
      const text = await badge.textContent();
      expect(text).toContain('pts');
    }
  });

  test('page does not contain broken image references', async ({ page }) => {
    await page.goto('/blog/high-scoring/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        expect(src.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
