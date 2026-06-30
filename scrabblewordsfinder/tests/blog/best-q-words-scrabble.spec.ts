import { test, expect } from '@playwright/test';

const PAGE = '/blog/best-q-words-scrabble/';

test.describe('Best Q Words — Page & Hero Card — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card is visible with Q TILE badge', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r').first();
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('Q TILE');
  });

  test('hero card shows 10 POINTS PER TILE headline', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r').first();
    await expect(heroCard).toContainText('10 POINTS PER TILE');
  });

  test('hero card shows subtitle facts', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50.bg-gradient-to-r').first();
    await expect(heroCard).toContainText('Highest value tile');
    await expect(heroCard).toContainText('Only 1 in the bag');
  });
});

test.describe('Best Q Words — Stat Strip — Positive', () => {

  test('stat strip container is visible', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(statStrip).toBeVisible();
  });

  test('stat strip shows 10 pts tile value', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(statStrip).toContainText('10 pts');
    await expect(statStrip).toContainText('Tile value');
  });

  test('stat strip shows 1 in the bag', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(statStrip).toContainText('In the bag');
  });

  test('stat strip shows 25 pts SQUEEZE as best', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(statStrip).toContainText('25 pts');
    await expect(statStrip).toContainText('SQUEEZE (best)');
  });

  test('stat strip shows 11 pts QI safety net', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(statStrip).toContainText('11 pts');
    await expect(statStrip).toContainText('QI (safety net)');
  });

  test('stat strip has exactly 4 stat items', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    const values = statStrip.locator('.text-xl.font-bold.text-cyan-400');
    await expect(values).toHaveCount(4);
  });
});

test.describe('Best Q Words — Insight Callout — Positive', () => {

  test('scoring insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('Scoring Insight');
  });

  test('scoring insight mentions SQUEEZE and 75 points', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toContainText('SQUEEZE');
    await expect(callout).toContainText('75 points');
  });
});

test.describe('Best Q Words — Comparison Cards — Positive', () => {

  test('Q advantages card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-green-500\\/30.bg-green-950\\/10').first();
    await expect(card).toBeVisible();
    await expect(card).toContainText('Q Advantages');
  });

  test('Q risks card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-red-500\\/30.bg-red-950\\/10').first();
    await expect(card).toBeVisible();
    await expect(card).toContainText('Q Risks');
  });
});

test.describe('Best Q Words — Inline Cross-Links — Positive', () => {

  test('dig deeper block is visible', async ({ page }) => {
    await page.goto(PAGE);
    const block = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').first();
    await expect(block).toBeVisible();
    await expect(block).toContainText('Dig Deeper');
  });

  test('cross-links contain correct hrefs', async ({ page }) => {
    await page.goto(PAGE);
    const block = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').first();
    const links = block.locator('a');
    await expect(links).toHaveCount(2);
    await expect(links.nth(0)).toHaveAttribute('href', '/blog/highest-scoring-scrabble-words/');
    await expect(links.nth(1)).toHaveAttribute('href', '/blog/words-starting-with-q/');
  });
});

test.describe('Best Q Words — Q-Without-U Pill Badges — Positive', () => {

  test('pill badges section is visible with title', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('text=Essential Q-Without-U Words');
    await expect(section).toBeVisible();
  });

  test('pill badges show 7 Q-without-U words', async ({ page }) => {
    await page.goto(PAGE);
    // Pill badges are spans with the specific structure
    const badges = page.locator('.inline-flex.items-center.gap-1\\.5.px-3.py-1\\.5.rounded-lg.bg-gray-800.border.border-gray-700');
    await expect(badges).toHaveCount(7);
  });

  test('pill badges include QI, QADI, QAT, QOPH', async ({ page }) => {
    await page.goto(PAGE);
    const container = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3');
    await expect(container).toContainText('QI');
    await expect(container).toContainText('QADI');
    await expect(container).toContainText('QAT');
    await expect(container).toContainText('QOPH');
  });
});

test.describe('Best Q Words — Warning Callout — Positive', () => {

  test('critical rule callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('Critical Rule');
  });

  test('warning callout contains QI exchange advice', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(callout).toContainText('Never exchange Q if you know QI');
  });
});

test.describe('Best Q Words — Purple Strategy Tips — Positive', () => {

  test('strategy tips section has 5 purple tiles', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips).toHaveCount(5);
  });

  test('first strategy tip mentions QI as safety net', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips.nth(0)).toContainText('QI is your safety net');
  });

  test('strategy tips mention premium squares', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips.nth(1)).toContainText('premium squares is devastating');
  });
});

test.describe('Best Q Words — Premium Square Math — Positive', () => {

  test('premium square math callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    // Second green block (first is Q Advantages card)
    const mathCallout = callouts.nth(1);
    await expect(mathCallout).toBeVisible();
    await expect(mathCallout).toContainText('Premium Square Math');
  });

  test('premium square math shows QI, QUIZ, QUARTZ calculations', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    const mathCallout = callouts.nth(1);
    await expect(mathCallout).toContainText('21 points');
    await expect(mathCallout).toContainText('44 points');
    await expect(mathCallout).toContainText('34 points');
  });
});

test.describe('Best Q Words — Related Articles & CTA — Positive', () => {

  test('related articles section has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('related articles links point to correct pages', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    await expect(links.nth(0)).toHaveAttribute('href', '/blog/highest-scoring-scrabble-words/');
    await expect(links.nth(1)).toHaveAttribute('href', '/blog/best-z-words-scrabble/');
    await expect(links.nth(2)).toHaveAttribute('href', '/blog/best-x-words-scrabble/');
  });

  test('CTA box is visible with word finder link', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.border-blue-800.rounded-xl').last();
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Test your Q words');
    const link = cta.locator('a[href="/"]');
    await expect(link).toContainText('Open Word Finder');
  });
});

test.describe('Best Q Words — Diamond Mine Indicator — Positive', () => {

  test('diamond mine indicator is visible on page', async ({ page }) => {
    await page.goto(PAGE);
    const indicator = page.locator('.border-purple-500\\/50.bg-purple-950\\/30');
    await expect(indicator).toBeVisible();
  });

  test('diamond mine indicator shows correct reward text', async ({ page }) => {
    await page.goto(PAGE);
    const indicator = page.locator('.border-purple-500\\/50.bg-purple-950\\/30');
    await expect(indicator).toContainText('Mined');
    await expect(indicator).toContainText('5 diamonds per claim');
  });

  test('diamond mine indicator has diamond emoji', async ({ page }) => {
    await page.goto(PAGE);
    const indicator = page.locator('.border-purple-500\\/50.bg-purple-950\\/30');
    await expect(indicator).toContainText('💎');
  });
});

test.describe('Best Q Words — Diamond Mine Indicator — Negative', () => {

  test('only one diamond mine indicator exists on page', async ({ page }) => {
    await page.goto(PAGE);
    const indicators = page.locator('.border-purple-500\\/50.bg-purple-950\\/30');
    await expect(indicators).toHaveCount(1);
  });

  test('diamond mine indicator text is not empty', async ({ page }) => {
    await page.goto(PAGE);
    const text = page.locator('.border-purple-500\\/50.bg-purple-950\\/30 p');
    const content = await text.textContent();
    expect(content?.trim().length).toBeGreaterThan(0);
  });

  test('diamond mine indicator does not expose mine ID or page path', async ({ page }) => {
    await page.goto(PAGE);
    const indicator = page.locator('.border-purple-500\\/50.bg-purple-950\\/30');
    const text = await indicator.textContent();
    expect(text).not.toContain('Mine #');
    expect(text).not.toContain('/blog/best-q-words-scrabble/');
  });
});

test.describe('Best Q Words — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards exist', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-amber-500\\/50.bg-gradient-to-r');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate stat strips (cyan) exist', async ({ page }) => {
    await page.goto(PAGE);
    const strips = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(strips).toHaveCount(1);
  });

  test('stat strip values are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    const values = statStrip.locator('.text-xl.font-bold.text-cyan-400');
    const count = await values.count();
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('stat strip labels are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    const labels = statStrip.locator('.text-xs.text-gray-400');
    const count = await labels.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await labels.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('pill badges do not have empty word text', async ({ page }) => {
    await page.goto(PAGE);
    const words = page.locator('.inline-flex.items-center.gap-1\\.5 .text-white.font-bold');
    const count = await words.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await words.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no broken internal links on page', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('a[href^="/"]');
    const count = await internalLinks.count();
    expect(count).toBeGreaterThan(0);
    // Verify hrefs are well-formed (not empty or just #)
    for (let i = 0; i < count; i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      expect(href).not.toBe('');
      expect(href).not.toBe('#');
    }
  });

  test('related articles aside does not have duplicate links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    const count = await links.count();
    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(hrefs.has(href!)).toBe(false);
      hrefs.add(href!);
    }
  });
});
