import { test, expect } from '@playwright/test';

const PAGE = '/blog/rack-management-basics/';

test.describe('Rack Management Basics — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('core principle callout box is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=Core Principle');
    await expect(callout).toBeVisible();
  });

  test('vowel-consonant stat strip displays ideal numbers', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('2–3');
    await expect(statStrip).toContainText('4–5');
    await expect(statStrip).toContainText('~43%');
  });

  test('good and risky leave comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const goodCard = page.locator('text=Good Leave: E-S');
    const riskyCard = page.locator('text=Risky Leave: T-R-A');
    await expect(goodCard).toBeVisible();
    await expect(riskyCard).toBeVisible();
  });

  test('power tile badges display all 7 key tiles', async ({ page }) => {
    await page.goto(PAGE);
    const badgeContainer = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3').first();
    await expect(badgeContainer).toBeVisible();
    for (const letter of ['S', 'E', 'R', 'A', 'N', 'T']) {
      await expect(badgeContainer.locator(`text=${letter}`).first()).toBeVisible();
    }
    // Blank tile badge
    await expect(badgeContainer.locator('text=blank')).toBeVisible();
  });

  test('rack poison warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('text=Rack Poison — Avoid Duplicates');
    await expect(warning).toBeVisible();
  });

  test('exchange decision process shows 4 numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    const stepsBox = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').first();
    await expect(stepsBox).toBeVisible();
    await expect(stepsBox.locator('text=Exchange Decision Process')).toBeVisible();
    const steps = stepsBox.locator('.flex.items-start.gap-3');
    await expect(steps).toHaveCount(4);
  });

  test('exchange stat strip shows cost and payoff numbers', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('~25 pts');
    await expect(statStrip).toContainText('2–3 turns');
    await expect(statStrip).toContainText('30+ pts');
  });

  test('bingo builder rule callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=Bingo Builder Rule');
    await expect(callout).toBeVisible();
  });

  test('high and low turnover comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const highTurnover = page.locator('text=High Turnover: 3-4 tiles/turn');
    const lowTurnover = page.locator('text=Low Turnover: 2 tiles/turn');
    await expect(highTurnover).toBeVisible();
    await expect(lowTurnover).toBeVisible();
  });

  test('strategy tips section has 5 purple strategy cards', async ({ page }) => {
    await page.goto(PAGE);
    const strategyCards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(strategyCards).toHaveCount(5);
  });

  test('related articles section links to rack-leave-explained', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/rack-leave-explained/"]');
    await expect(link).toBeVisible();
  });

  test('related articles section links to best-bingo-racks', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/best-bingo-racks/"]');
    await expect(link).toBeVisible();
  });

  test('dealing-with-bad-tiles link is properly structured', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/dealing-with-bad-tiles/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Dealing with Bad Tiles');
  });

  test('hero card displays Core Discipline label', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.rounded-2xl.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('Core Discipline');
  });

  test('hero card displays KEEP BETTER, SCORE HIGHER title', async ({ page }) => {
    await page.goto(PAGE);
    const heroTitle = page.locator('text=KEEP BETTER, SCORE HIGHER');
    await expect(heroTitle).toBeVisible();
  });

  test('hero card shows vowel-consonant ratio summary', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.rounded-2xl.border-2.border-amber-500\\/50');
    await expect(heroCard).toContainText('2-3 vowels');
    await expect(heroCard).toContainText('4-5 consonants');
    await expect(heroCard).toContainText('No duplicates');
  });
});

test.describe('Rack Management Basics — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate Core Principle callout boxes', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('text=Core Principle');
    await expect(callouts).toHaveCount(1);
  });

  test('no duplicate Rack Poison warning callouts', async ({ page }) => {
    await page.goto(PAGE);
    const warnings = page.locator('text=Rack Poison — Avoid Duplicates');
    await expect(warnings).toHaveCount(1);
  });

  test('no duplicate Exchange Decision Process sections', async ({ page }) => {
    await page.goto(PAGE);
    const sections = page.locator('text=Exchange Decision Process');
    await expect(sections).toHaveCount(1);
  });

  test('no duplicate Bingo Builder Rule callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('text=Bingo Builder Rule');
    await expect(callouts).toHaveCount(1);
  });

  test('related articles do not link to removed midgame-strategy', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const oldLink = aside.locator('a[href="/blog/midgame-strategy/"]');
    await expect(oldLink).toHaveCount(0);
  });

  test('no orphaned text outside anchor tags in related articles', async ({ page }) => {
    await page.goto(PAGE);
    // The dealing-with-bad-tiles link should be properly wrapped in an <a> tag
    const properLink = page.locator('a[href="/blog/dealing-with-bad-tiles/"]');
    await expect(properLink).toHaveCount(1);
    // Ensure no stray "Turn Weakness Into Strategy" text exists outside of a proper anchor
    const strayText = page.locator('text=Turn Weakness Into Strategy');
    await expect(strayText).toHaveCount(0);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('no duplicate hero cards on page', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.rounded-2xl.border-2.border-amber-500\\/50');
    await expect(heroCards).toHaveCount(1);
  });

  test('hero card does not contain broken or empty content', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.rounded-2xl.border-2.border-amber-500\\/50');
    const text = await heroCard.textContent();
    expect(text?.trim().length).toBeGreaterThan(50);
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});
