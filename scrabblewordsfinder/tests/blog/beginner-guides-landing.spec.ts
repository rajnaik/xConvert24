import { test, expect } from '@playwright/test';

test.describe('Beginner Guides Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/beginner-guides/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct title containing Beginner', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('beginner');
  });

  test('page has meta description', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(50);
  });

  test('page has h1 heading about beginner guides', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const h1 = page.locator('.max-w-3xl h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.toLowerCase()).toContain('beginner');
  });

  test('stat strip shows category overview with 10 Guides', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const statStrip = page.locator('.border-emerald-500\\/30.bg-emerald-950\\/10').first();
    await expect(statStrip).toBeVisible();
    const text = await statStrip.textContent();
    expect(text).toContain('10');
    expect(text).toContain('Guides');
  });

  test('stat strip shows 0 Jargon and Free', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const statStrip = page.locator('.border-emerald-500\\/30.bg-emerald-950\\/10').first();
    const text = await statStrip.textContent();
    expect(text).toContain('0');
    expect(text).toContain('Jargon');
    expect(text).toContain('Free');
  });

  test('insight callout block is present with Beginner Edge content', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(callout).toBeVisible();
    const text = await callout.textContent();
    expect(text).toContain("Beginner's Edge");
    expect(text).toContain('127 two-letter words');
  });

  test('learning path pill badges are visible with 5 steps', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const badges = page.locator('.bg-gray-800.border-gray-700');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('hero card Learn the Fundamentals is present', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const heroCard = page.locator('.border-emerald-500\\/50');
    await expect(heroCard).toBeVisible();
    const text = await heroCard.textContent();
    expect(text).toContain('LEARN THE FUNDAMENTALS');
  });

  test('section heading Understanding the Game exists with amber style', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const heading = page.locator('h2.border-l-4:has-text("Understanding the Game")');
    await expect(heading).toBeVisible();
  });

  test('section heading Scoring & Board Mastery exists', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const heading = page.locator('h2.border-l-4:has-text("Scoring & Board Mastery")');
    await expect(heading).toBeVisible();
  });

  test('section heading Strategy & Winning exists', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const heading = page.locator('h2.border-l-4:has-text("Strategy & Winning")');
    await expect(heading).toBeVisible();
  });

  test('what-is-scrabble post link is visible with number badge', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const link = page.locator('a[href="/blog/what-is-scrabble/"]');
    await expect(link).toBeVisible();
  });

  test('how-to-play-scrabble post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/how-to-play-scrabble/"]')).toBeVisible();
  });

  test('scrabble-rules-explained post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/scrabble-rules-explained/"]')).toBeVisible();
  });

  test('scoring guide post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/scrabble-scoring-guide/"]')).toBeVisible();
  });

  test('premium squares post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/understanding-premium-squares/"]')).toBeVisible();
  });

  test('blank tiles post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/how-blank-tiles-work/"]')).toBeVisible();
  });

  test('beginner strategy post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/beginner-scrabble-strategy/"]')).toBeVisible();
  });

  test('common mistakes post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/common-scrabble-mistakes/"]')).toBeVisible();
  });

  test('how to win post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/how-to-win-scrabble/"]')).toBeVisible();
  });

  test('scrabble etiquette post link is visible', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    await expect(page.locator('a[href="/blog/scrabble-etiquette/"]')).toBeVisible();
  });

  test('comparison cards show Smart Scoring vs Common Mistake', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const smartCard = page.locator('.border-green-500\\/30:has-text("Smart Scoring")');
    const mistakeCard = page.locator('.border-red-500\\/30:has-text("Common Mistake")');
    await expect(smartCard).toBeVisible();
    await expect(mistakeCard).toBeVisible();
  });

  test('strategy stat strip shows score boost stats', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(statStrip).toBeVisible();
    const text = await statStrip.textContent();
    expect(text).toContain('+50-100');
    expect(text).toContain('Score boost/game');
  });

  test('first game checklist is visible with 5 steps', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const checklist = page.locator('.border-purple-500\\/30.bg-purple-950\\/10');
    await expect(checklist).toBeVisible();
    const text = await checklist.textContent();
    expect(text).toContain('First Game Checklist');
    // Should have 5 numbered items
    const items = checklist.locator('.rounded-full');
    const count = await items.count();
    expect(count).toBe(5);
  });

  test('dig deeper cross-links section exists with two-letter words link', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const crossLinks = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks.locator('a[href="/blog/two-letter-words/"]')).toBeVisible();
  });

  test('where to go next cross-links section exists', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const nextSection = page.locator('.border-indigo-500\\/30:has-text("Where to Go Next")');
    await expect(nextSection).toBeVisible();
    await expect(nextSection.locator('a[href="/blog/strategy/"]')).toBeVisible();
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
  });

  test('CTA box with word finder link is present', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const cta = page.locator('text=Open Word Finder');
    await expect(cta).toBeVisible();
  });

  test('CTA text mentions instant results', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const ctaSection = page.locator('.from-blue-900\\/20');
    const text = await ctaSection.textContent();
    expect(text).toContain('instant results as you type');
  });

  test('More Categories section is present', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const moreCats = page.locator('h3:has-text("More Categories")');
    await expect(moreCats).toBeVisible();
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });
});

test.describe('Beginner Guides Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/beginner-guides/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('only one h1 in the main content area', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('no duplicate post links exist', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const postSlugs = [
      '/blog/what-is-scrabble/',
      '/blog/how-to-play-scrabble/',
      '/blog/scrabble-rules-explained/',
      '/blog/scrabble-scoring-guide/',
      '/blog/understanding-premium-squares/',
      '/blog/how-blank-tiles-work/',
      '/blog/beginner-scrabble-strategy/',
      '/blog/common-scrabble-mistakes/',
      '/blog/how-to-win-scrabble/',
      '/blog/scrabble-etiquette/',
    ];
    for (const slug of postSlugs) {
      const links = page.locator(`.max-w-3xl a[href="${slug}"]`);
      const count = await links.count();
      expect(count, `Duplicate links found for ${slug}`).toBeLessThanOrEqual(1);
    }
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const links = await page.locator('.max-w-3xl a[href^="/"]').all();
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
    await page.goto('/blog/beginner-guides/');
    const links = await page.locator('.max-w-3xl a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('page does not show undefined or raw Astro expressions', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const visibleText = await page.locator('.max-w-3xl').textContent();
    expect(visibleText).not.toContain('undefined');
    expect(visibleText).not.toContain('${');
  });

  test('no unclosed HTML tags causing layout collapse', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const mainContainer = page.locator('.max-w-3xl.mx-auto');
    await expect(mainContainer).toBeVisible();
    const height = await mainContainer.evaluate(el => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(500);
  });

  test('all section headings are h2 elements', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const sectionHeadings = page.locator('h2.border-l-4');
    const count = await sectionHeadings.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('no orphan stat strip with missing numbers', async ({ page }) => {
    await page.goto('/blog/beginner-guides/');
    const statStrips = page.locator('.border-emerald-500\\/30.bg-emerald-950\\/10');
    const count = await statStrips.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await statStrips.nth(i).textContent();
        expect(text).not.toContain('NaN');
        expect(text).not.toContain('undefined');
      }
    }
  });
});
