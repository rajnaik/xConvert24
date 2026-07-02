import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Lex AI Solver Modal — opened from the Ask Lex AI button on the solver page.
 * Modal has rack input (7 tiles), Ask Lex button, and AI response area.
 */

test.describe('Lex Solver Modal — Positive', () => {
  test('Ask Lex AI button opens the solver modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const btn = page.locator('#ask-lex-tile');
    await expect(btn).toBeVisible();
    await btn.click();

    const modal = page.locator('#lex-solver-modal');
    await expect(modal).toBeVisible();
  });

  test('modal contains rack input with 7-character maxlength and size', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const rackInput = page.locator('#lex-rack-input');
    await expect(rackInput).toBeVisible();
    await expect(rackInput).toHaveAttribute('maxlength', '7');
    await expect(rackInput).toHaveAttribute('size', '7');
  });

  test('rack input has fixed width styling (not flex-1)', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const rackInput = page.locator('#lex-rack-input');
    await expect(rackInput).toBeVisible();
    await expect(rackInput).not.toHaveClass(/flex-1/);
    await expect(rackInput).toHaveClass(/w-\[12ch\]/);
  });

  test('modal contains Find Words submit button', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const solveBtn = page.locator('#lex-solve-btn');
    await expect(solveBtn).toBeVisible();
    await expect(solveBtn).toHaveText('Find Words');
  });

  test('modal pre-fills rack from solver input', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Type into solver first
    await page.locator('#text-solver').fill('QUARTZ');
    await page.locator('#ask-lex-tile').click();

    const rackInput = page.locator('#lex-rack-input');
    await expect(rackInput).toHaveValue('QUARTZ');
  });

  test('modal closes on close button click', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const modal = page.locator('#lex-solver-modal');
    await expect(modal).toBeVisible();

    await page.locator('#lex-solver-close').click();
    await expect(modal).not.toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const modal = page.locator('#lex-solver-modal');
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const modal = page.locator('#lex-solver-modal');
    await expect(modal).toBeVisible();

    // Click on the backdrop (the outer div)
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });

  test('Ask Lex AI button has data-track attribute for click tracking', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const btn = page.locator('#ask-lex-tile');
    await expect(btn).toHaveAttribute('data-track', 'Ask Lex AI');
  });

  test('Find Words button has data-track attribute for click tracking', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const solveBtn = page.locator('#lex-solve-btn');
    await expect(solveBtn).toHaveAttribute('data-track', 'Lex Find Words');
  });

  test('Chat send button has data-track attribute for click tracking', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const sendBtn = page.locator('#lex-solver-chat-send');
    await expect(sendBtn).toHaveAttribute('data-track', 'Lex Chat Send');
  });
});

test.describe('Lex Solver Modal — Negative', () => {
  test('no duplicate modal elements on the page', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    const modals = page.locator('#lex-solver-modal');
    await expect(modals).toHaveCount(1);
  });

  test('does not submit with fewer than 2 tiles', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    const rackInput = page.locator('#lex-rack-input');
    await rackInput.fill('A');
    await page.locator('#lex-solve-btn').click();

    // Should show error message, not crash
    const response = page.locator('#lex-solver-response');
    await expect(response).toContainText('at least 2');
  });

  test('does not cause JavaScript errors when opening modal', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();

    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
