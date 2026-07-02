import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const HOME_URL = `${BASE_URL}/`;

/**
 * EV Score Widget — Homepage (under Solver textbox)
 * The reusable EVScore component (#ev-score-widget) displays rack quality
 * below the solver text input. It auto-updates as the user types tiles.
 */

test.describe('EV Score Widget (Homepage) — Positive', () => {
  test('widget exists in the DOM and is hidden by default', async ({ page }) => {
    await page.goto(HOME_URL);

    const widget = page.locator('#ev-score-widget');
    await expect(widget).toBeAttached();
    await expect(widget).toHaveClass(/hidden/);
  });

  test('widget becomes visible when tiles are typed in the solver input', async ({ page }) => {
    await page.goto(HOME_URL);

    const solverInput = page.locator('#text-solver');
    await solverInput.fill('SATIRE');
    await solverInput.dispatchEvent('input');

    const widget = page.locator('#ev-score-widget');
    await expect(widget).not.toHaveClass(/hidden/);
  });

  test('widget shows a numeric score out of 100', async ({ page }) => {
    await page.goto(HOME_URL);

    await page.locator('#text-solver').fill('AEILNRT');
    await page.locator('#text-solver').dispatchEvent('input');

    const scoreText = await page.locator('#ev-score-widget .ev-score-value').textContent();
    expect(scoreText).toMatch(/^\d+\/100$/);
  });

  test('widget shows a quality label', async ({ page }) => {
    await page.goto(HOME_URL);

    await page.locator('#text-solver').fill('SATIRE');
    await page.locator('#text-solver').dispatchEvent('input');

    const label = await page.locator('#ev-score-widget .ev-score-label').textContent();
    expect(['Excellent', 'Strong', 'Decent', 'Weak', 'Poor']).toContain(label);
  });

  test('progress bar has non-zero width for a valid rack', async ({ page }) => {
    await page.goto(HOME_URL);

    await page.locator('#text-solver').fill('RETINAS');
    await page.locator('#text-solver').dispatchEvent('input');

    const fill = page.locator('#ev-score-widget .ev-score-fill');
    const width = await fill.evaluate(el => (el as HTMLElement).style.width);
    expect(width).not.toBe('0%');
  });

  test('score updates live as letters change', async ({ page }) => {
    await page.goto(HOME_URL);

    const solver = page.locator('#text-solver');

    // Bad rack
    await solver.fill('QQQ');
    await solver.dispatchEvent('input');
    const score1 = await page.locator('#ev-score-widget .ev-score-value').textContent();

    // Good rack
    await solver.fill('SATIRE');
    await solver.dispatchEvent('input');
    const score2 = await page.locator('#ev-score-widget .ev-score-value').textContent();

    expect(score1).not.toBe(score2);
  });

  test('excellent rack (SATIRES with S) scores 65+', async ({ page }) => {
    await page.goto(HOME_URL);

    await page.locator('#text-solver').fill('SATIRES');
    await page.locator('#text-solver').dispatchEvent('input');

    const scoreText = await page.locator('#ev-score-widget .ev-score-value').textContent();
    const score = parseInt(scoreText!.split('/')[0], 10);
    expect(score).toBeGreaterThanOrEqual(65);
  });
});

test.describe('EV Score Label Link — Positive', () => {
  test('EV Score label link exists with correct text', async ({ page }) => {
    await page.goto(HOME_URL);

    const label = page.locator('a[href="#ev-score-info"]');
    await expect(label).toBeVisible();
    await expect(label).toHaveText('EV Score:');
  });

  test('EV Score label has tooltip with explanation', async ({ page }) => {
    await page.goto(HOME_URL);

    const label = page.locator('a[href="#ev-score-info"]');
    const title = await label.getAttribute('title');
    expect(title).toContain('rack quality');
    expect(title).toContain('0-100');
  });

  test('EV Score label and widget are in a flex wrapper', async ({ page }) => {
    await page.goto(HOME_URL);

    const wrapper = page.locator('#ev-score-widget').locator('..');
    await expect(wrapper).toHaveClass(/flex/);
    await expect(wrapper).toHaveClass(/items-center/);
    await expect(wrapper).toHaveClass(/gap-2/);
  });

  test('EV Score label has cursor-help styling', async ({ page }) => {
    await page.goto(HOME_URL);

    const label = page.locator('a[href="#ev-score-info"]');
    await expect(label).toHaveClass(/cursor-help/);
  });
});

test.describe('EV Score Label Link — Negative', () => {
  test('no duplicate EV Score label links exist', async ({ page }) => {
    await page.goto(HOME_URL);

    const labels = page.locator('a[href="#ev-score-info"]');
    await expect(labels).toHaveCount(1);
  });

  test('EV Score label does not navigate away from page on click', async ({ page }) => {
    await page.goto(HOME_URL);

    const label = page.locator('a[href="#ev-score-info"]');
    await label.click();

    // Should still be on the same page (anchor link, no navigation)
    expect(page.url()).toContain(BASE_URL);
  });
});

test.describe('EV Score Widget (Homepage) — Negative', () => {
  test('widget is hidden when solver input is empty', async ({ page }) => {
    await page.goto(HOME_URL);

    const widget = page.locator('#ev-score-widget');
    await expect(widget).toHaveClass(/hidden/);
  });

  test('widget hides when solver input is cleared', async ({ page }) => {
    await page.goto(HOME_URL);

    const solver = page.locator('#text-solver');
    await solver.fill('TEST');
    await solver.dispatchEvent('input');
    await expect(page.locator('#ev-score-widget')).not.toHaveClass(/hidden/);

    await solver.fill('');
    await solver.dispatchEvent('input');
    await expect(page.locator('#ev-score-widget')).toHaveClass(/hidden/);
  });

  test('no duplicate EV score widgets exist on the page', async ({ page }) => {
    await page.goto(HOME_URL);

    const widgets = page.locator('#ev-score-widget');
    await expect(widgets).toHaveCount(1);
  });

  test('widget does not cause JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(HOME_URL);

    await page.locator('#text-solver').fill('ZXQJKVW');
    await page.locator('#text-solver').dispatchEvent('input');

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('poor rack (all duplicates) scores below 30', async ({ page }) => {
    await page.goto(HOME_URL);

    await page.locator('#text-solver').fill('AAAAAAA');
    await page.locator('#text-solver').dispatchEvent('input');

    const scoreText = await page.locator('#ev-score-widget .ev-score-value').textContent();
    const score = parseInt(scoreText!.split('/')[0], 10);
    expect(score).toBeLessThan(30);
  });
});
