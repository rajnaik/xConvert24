import { test, expect } from '@playwright/test';

const PAGE = '/blog/vowel-heavy-rack-solutions/';

test.describe('Vowel-Heavy Rack Solutions — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with Vowel Flood badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('text=VOWEL FLOOD? WORDS EXIST.');
    await expect(heroCard).toBeVisible();
  });

  test('hero card shows 42 valid words stat', async ({ page }) => {
    await page.goto(PAGE);
    const stat = page.locator('text=42 valid Scrabble words use 3+ vowels');
    await expect(stat).toBeVisible();
  });

  test('rack balance stat strip shows all 4 levels', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('3V + 4C');
    await expect(statStrip).toContainText('4V + 3C');
    await expect(statStrip).toContainText('5V + 2C');
    await expect(statStrip).toContainText('6V + 1C');
  });

  test('stat strip labels include Ideal balance and Emergency', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('Ideal balance');
    await expect(statStrip).toContainText('Emergency');
  });

  test('Why Vowel Floods Happen insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=Why Vowel Floods Happen');
    await expect(callout).toBeVisible();
  });

  test('insight callout mentions 42 vowels vs 56 consonants', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toContainText('42 vowels vs 56 consonants');
  });

  test('h1 heading is correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Vowel-Heavy Rack Solutions in Scrabble');
  });

  test('breadcrumb links to blog index and strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    const strategyLink = page.locator('nav a[href="/blog/strategy/"]');
    await expect(strategyLink).toBeVisible();
  });

  test('article meta shows date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-15"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=6 min read');
    await expect(readTime).toBeVisible();
  });

  test('word finder link in meta section exists', async ({ page }) => {
    await page.goto(PAGE);
    const metaSection = page.locator('.not-prose.mb-8.flex');
    const finderLink = metaSection.locator('a[href="/"]').filter({ hasText: 'Word Finder' });
    await expect(finderLink).toBeVisible();
  });

  test('Recognizing a Vowel-Heavy Rack h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Recognizing a Vowel-Heavy Rack")');
    await expect(h2).toBeVisible();
  });

  test('Decision Framework h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Dump vs Exchange")');
    await expect(h2).toBeVisible();
  });

  test('decision process numbered steps show all 4 steps', async ({ page }) => {
    await page.goto(PAGE);
    const decisionBlock = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').filter({ hasText: 'Decision Process' });
    await expect(decisionBlock).toBeVisible();
    await expect(decisionBlock).toContainText('Count your vowels');
    await expect(decisionBlock).toContainText('Scan for dump words');
    await expect(decisionBlock).toContainText('Check the bag');
    await expect(decisionBlock).toContainText('Compare scores');
  });

  test('dump vs exchange comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const dumpCard = page.locator('.border-green-500\\/30').filter({ hasText: 'Play a Dump Word When' });
    const exchangeCard = page.locator('.border-red-500\\/30').filter({ hasText: 'Exchange Tiles When' });
    await expect(dumpCard).toBeVisible();
    await expect(exchangeCard).toBeVisible();
  });

  test('exchange cost vs benefit stat strip shows values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('0 pts');
    await expect(statStrip).toContainText('~25 pts');
    await expect(statStrip).toContainText('35+ pts');
    await expect(statStrip).toContainText('6 pts');
  });

  test('Strategic Placement h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Strategic Placement for Vowel-Heavy Words")');
    await expect(h2).toBeVisible();
  });

  test('purple strategy tips are visible with correct content', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    const count = await tips.count();
    expect(count).toBeGreaterThanOrEqual(5);
    await expect(tips.first()).toContainText('Hook onto existing consonants');
  });

  test('Placement Math insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-green-500\\/30.bg-green-950\\/10').filter({ hasText: 'Placement Math' });
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('OUIJA on a Double Word Score = 24 points');
  });

  test('Practice Drills h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Practice Drills for Vowel Floods")');
    await expect(h2).toBeVisible();
  });

  test('weekly drill routine numbered steps are present', async ({ page }) => {
    await page.goto(PAGE);
    const drillBlock = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').filter({ hasText: 'Weekly Drill Routine' });
    await expect(drillBlock).toBeVisible();
    await expect(drillBlock).toContainText('Flashcard the top 10');
    await expect(drillBlock).toContainText('Random rack challenge');
    await expect(drillBlock).toContainText('Board placement practice');
    await expect(drillBlock).toContainText('Exchange vs dump decision reps');
  });

  test('Words to Know Cold pill badges are visible', async ({ page }) => {
    await page.goto(PAGE);
    const pillSection = page.locator('text=Words to Know Cold');
    await expect(pillSection).toBeVisible();
    const badges = page.locator('.bg-gray-800.border.border-gray-700');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('common mistake warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').filter({ hasText: 'Common Mistake' });
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('probability of drawing more vowels increases');
  });

  test('Dig Deeper cross-links section exists with links', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks).toContainText('Rack Management Basics');
    await expect(crossLinks).toContainText('Rack Leave Explained');
  });

  test('Related Articles aside with linked posts is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'vowel-dump words' });
    await expect(cta).toBeVisible();
    const ctaLink = cta.locator('a[href="/"]');
    await expect(ctaLink).toContainText('Open Word Finder');
  });

  test('Back to Blog link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a[href="/blog/"]').filter({ hasText: 'Back to all articles' });
    await expect(backLink).toBeVisible();
  });
});

test.describe('Vowel-Heavy Rack Solutions — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=VOWEL FLOOD? WORDS EXIST.');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate h1 headings in article', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate Why Vowel Floods Happen callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('text=Why Vowel Floods Happen');
    await expect(callouts).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('no broken strategy breadcrumb link', async ({ page }) => {
    await page.goto(PAGE);
    const strategyLink = page.locator('nav a[href="/blog/strategy/"]');
    await expect(strategyLink).toHaveAttribute('href', '/blog/strategy/');
  });

  test('JSON-LD structured data is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('no duplicate Decision Process blocks', async ({ page }) => {
    await page.goto(PAGE);
    const blocks = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').filter({ hasText: 'Decision Process' });
    await expect(blocks).toHaveCount(1);
  });

  test('no duplicate Weekly Drill Routine blocks', async ({ page }) => {
    await page.goto(PAGE);
    const blocks = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').filter({ hasText: 'Weekly Drill Routine' });
    await expect(blocks).toHaveCount(1);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(ctas).toHaveCount(1);
  });

  test('no duplicate Related Articles aside sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });

  test('cross-link hrefs do not point to current page', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinkSection = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = crossLinkSection.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('vowel-heavy-rack-solutions');
    }
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
});
