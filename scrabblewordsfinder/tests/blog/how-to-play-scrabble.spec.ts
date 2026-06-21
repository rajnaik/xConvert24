import { test, expect } from '@playwright/test';

const PAGE = '/blog/how-to-play-scrabble/';

test.describe('How to Play Scrabble — Visual Treatment — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('breadcrumb shows Beginner Guides category', async ({ page }) => {
    await page.goto(PAGE);
    const breadcrumb = page.locator('nav.text-sm.text-gray-400 span.text-gray-300');
    await expect(breadcrumb).toHaveText('Beginner Guides');
  });

  test('hero card with LEARN IN 8 STEPS is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('LEARN IN 8 STEPS');
  });

  test('hero card shows step flow summary', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCard).toContainText('Setup');
    await expect(heroCard).toContainText('Score');
    await expect(heroCard).toContainText('End');
  });

  test('stat strip shows 4 game basics with correct values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('15×15');
    await expect(statStrip).toContainText('100');
    await expect(statStrip).toContainText('7');
    await expect(statStrip).toContainText('2-4');
  });

  test('stat strip labels describe game components', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('Board grid');
    await expect(statStrip).toContainText('Letter tiles');
    await expect(statStrip).toContainText('Tiles per rack');
    await expect(statStrip).toContainText('Players');
  });

  test('first word tip callout is visible with doubled emphasis', async ({ page }) => {
    await page.goto(PAGE);
    const tipCallout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(tipCallout).toBeVisible();
    await expect(tipCallout).toContainText('First Word Tip');
    await expect(tipCallout).toContainText('automatically doubled');
  });

  test('three building methods cards are rendered', async ({ page }) => {
    await page.goto(PAGE);
    const buildCards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20.hover\\:border-purple-400');
    // 3 build methods + 4 quick tips = 7 total purple hover cards
    const count = await buildCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('premium squares section has letter and word multiplier cards', async ({ page }) => {
    await page.goto(PAGE);
    const letterCard = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    const wordCard = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').filter({ hasText: 'Word Multipliers' });
    await expect(letterCard).toBeVisible();
    await expect(letterCard).toContainText('Letter Multipliers');
    await expect(wordCard).toBeVisible();
    await expect(wordCard).toContainText('Word Multipliers');
  });

  test('exchange rules warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('text=Exchange Rules').first();
    await expect(warning).toBeVisible();
  });

  test('turn summary shows 4 numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    const turnSummary = page.locator('.border-purple-500\\/30.bg-purple-950\\/10');
    await expect(turnSummary).toBeVisible();
    await expect(turnSummary).toContainText('Turn Summary');
    const steps = turnSummary.locator('.rounded-full');
    await expect(steps).toHaveCount(4);
  });

  test('next steps cross-link section contains internal links', async ({ page }) => {
    await page.goto(PAGE);
    const nextSteps = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(nextSteps).toBeVisible();
    await expect(nextSteps).toContainText('Next Steps');
    const links = nextSteps.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('next steps links point to beginner strategy and scoring guide', async ({ page }) => {
    await page.goto(PAGE);
    const nextSteps = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(nextSteps.locator('a[href="/blog/beginner-scrabble-strategy/"]')).toBeVisible();
    await expect(nextSteps.locator('a[href="/blog/scrabble-scoring-guide/"]')).toBeVisible();
  });

  test('CTA button to word finder is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });
});

test.describe('How to Play Scrabble — Visual Treatment — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('stat strip values are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    const values = statStrip.locator('.text-xl.font-bold.text-cyan-400');
    const count = await values.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no duplicate hero cards on the page', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate stat strips on the page', async ({ page }) => {
    await page.goto(PAGE);
    const statStrips = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrips).toHaveCount(1);
  });

  test('no duplicate next steps sections', async ({ page }) => {
    await page.goto(PAGE);
    const nextSteps = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(nextSteps).toHaveCount(1);
  });

  test('next steps links do not have empty href', async ({ page }) => {
    await page.goto(PAGE);
    const nextSteps = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = nextSteps.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });

  test('turn summary step numbers are sequential 1 through 4', async ({ page }) => {
    await page.goto(PAGE);
    const turnSummary = page.locator('.border-purple-500\\/30.bg-purple-950\\/10');
    const steps = turnSummary.locator('.rounded-full');
    const count = await steps.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await steps.nth(i).textContent();
      expect(text?.trim()).toBe(String(i + 1));
    }
  });

  test('breadcrumb does not still say How to Play', async ({ page }) => {
    await page.goto(PAGE);
    const breadcrumb = page.locator('nav.text-sm.text-gray-400 span.text-gray-300');
    await expect(breadcrumb).not.toHaveText('How to Play');
  });
});
