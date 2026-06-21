import { test, expect } from '@playwright/test';

const PAGE = '/blog/rack-leave-explained/';

test.describe('Rack Leave Explained — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with Core Concept badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=🎯 Core Concept');
    await expect(badge).toBeVisible();
  });

  test('hero card shows TWO DECISIONS, EVERY TURN heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=TWO DECISIONS, EVERY TURN');
    await expect(heading).toBeVisible();
  });

  test('hero card shows play now and keep for later tagline', async ({ page }) => {
    await page.goto(PAGE);
    const tagline = page.locator('text=What you play now · What you keep for later');
    await expect(tagline).toBeVisible();
  });

  test('stat strip displays 10-12 pts sacrifice value', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('10–12 pts');
  });

  test('stat strip displays blank future value 25-30 pts', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('25–30 pts');
  });

  test('stat strip displays S tile value 8-10 pts', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toContainText('8–10 pts');
  });

  test('strong leaves comparison card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-green-500\\/30').filter({ hasText: 'Strong Leaves' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('E-R-S');
  });

  test('weak leaves comparison card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-red-500\\/30').filter({ hasText: 'Weak Leaves' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('Q-V-W');
  });

  test('10-12 Point Rule callout box is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=The 10-12 Point Rule');
    await expect(callout).toBeVisible();
  });

  test('10-12 Point Rule callout mentions 15-20 extra points payback', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(callout).toContainText('15-20 extra points');
  });

  test('tile value pill badges are visible', async ({ page }) => {
    await page.goto(PAGE);
    const badgeContainer = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3');
    await expect(badgeContainer).toBeVisible();
    await expect(badgeContainer).toContainText('Blank');
    await expect(badgeContainer).toContainText('+25-30 pts');
    await expect(badgeContainer).toContainText('Q (no U)');
    await expect(badgeContainer).toContainText('-5 pts');
  });

  test('S tile badge shows +8-10 pts value', async ({ page }) => {
    await page.goto(PAGE);
    const badgeContainer = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3');
    await expect(badgeContainer).toContainText('+8-10 pts');
  });

  test('Common Trap warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('text=Common Trap');
    await expect(warning).toBeVisible();
  });

  test('Common Trap callout mentions low-probability gamble', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    await expect(callout).toContainText('low-probability gamble');
  });

  test('Dig Deeper cross-links section exists', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks).toContainText('Dig Deeper');
  });

  test('Dig Deeper links to rack-management-basics', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const link = crossLinks.locator('a[href="/blog/rack-management-basics/"]');
    await expect(link).toBeVisible();
  });

  test('Dig Deeper links to vowel-heavy-rack-solutions', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const link = crossLinks.locator('a[href="/blog/vowel-heavy-rack-solutions/"]');
    await expect(link).toBeVisible();
  });

  test('strategy tips section has 5 purple cards', async ({ page }) => {
    await page.goto(PAGE);
    const strategyCards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(strategyCards).toHaveCount(5);
  });

  test('strategy cards contain key advice text', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(cards.first()).toContainText('Score your leave, not just your play');
    await expect(cards.nth(1)).toContainText('The blank is sacred');
  });

  test('Related Articles aside is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
  });

  test('Related Articles links to rack-management-basics', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const link = aside.locator('a[href="/blog/rack-management-basics/"]');
    await expect(link).toBeVisible();
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'rack leave scores' });
    await expect(cta).toBeVisible();
    const ctaLink = cta.locator('a[href="/"]');
    await expect(ctaLink).toContainText('Open Word Finder');
  });
});

test.describe('Rack Leave Explained — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=TWO DECISIONS, EVERY TURN');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate Core Concept badges', async ({ page }) => {
    await page.goto(PAGE);
    const badges = page.locator('text=🎯 Core Concept');
    await expect(badges).toHaveCount(1);
  });

  test('no duplicate stat strips', async ({ page }) => {
    await page.goto(PAGE);
    const strips = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(strips).toHaveCount(1);
  });

  test('no duplicate 10-12 Point Rule callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('text=💡 The 10-12 Point Rule');
    await expect(callouts).toHaveCount(1);
  });

  test('no duplicate Common Trap warning callouts', async ({ page }) => {
    await page.goto(PAGE);
    const warnings = page.locator('text=⚠️ Common Trap');
    await expect(warnings).toHaveCount(1);
  });

  test('no duplicate Dig Deeper cross-links sections', async ({ page }) => {
    await page.goto(PAGE);
    const sections = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(sections).toHaveCount(1);
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

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('cross-link hrefs do not point to current page', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinkSection = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = crossLinkSection.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('rack-leave-explained');
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
