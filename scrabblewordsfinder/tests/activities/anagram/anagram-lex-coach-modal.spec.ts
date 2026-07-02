import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Lex Anagram Coach Modal — Positive ──────────────────────────────────
test.describe('Lex Anagram Coach Modal — Positive', () => {
  test('Lex Anagram Coach button is visible in the anagram panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator('#LexAnagram');
    await expect(lexBtn).toBeVisible();
    await expect(lexBtn).toContainText('Lex Anagram Coach');
  });

  test('clicking the Lex button opens the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator('#LexAnagram');
    await lexBtn.click();
    const modal = page.locator('#lex-anagram-modal');
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('modal displays the Lex avatar and title', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    const title = page.locator('#lex-modal-title');
    await expect(title).toHaveText('Lex Anagram Coach');
    const avatar = page.locator('#lex-anagram-modal img[alt="Lex"]');
    await expect(avatar).toBeVisible();
  });

  test('modal shows loading spinner initially', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    const loading = page.locator('#lex-anagram-loading');
    await expect(loading).toBeVisible();
  });

  test('modal eventually shows analysis text (loading disappears)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    // Wait for loading to disappear (API responds)
    const loading = page.locator('#lex-anagram-loading');
    await expect(loading).toBeHidden({ timeout: 15000 });
    // Either result or error should be visible
    const result = page.locator('#lex-anagram-result');
    const error = page.locator('#lex-anagram-error');
    const resultVisible = await result.isVisible();
    const errorVisible = await error.isVisible();
    expect(resultVisible || errorVisible).toBe(true);
  });

  test('analysis text is non-empty when result is shown', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    await page.locator('#lex-anagram-loading').waitFor({ state: 'hidden', timeout: 15000 });
    const result = page.locator('#lex-anagram-result');
    if (await result.isVisible()) {
      const text = page.locator('#lex-analysis-text');
      await expect(text).not.toHaveText('');
    }
  });

  test('close button dismisses the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    const modal = page.locator('#lex-anagram-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await page.locator('#lex-anagram-close').click();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('clicking backdrop closes the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    const modal = page.locator('#lex-anagram-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    // Click the backdrop (top-left corner, outside the dialog box)
    await page.locator('#lex-anagram-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(modal).toHaveClass(/hidden/);
  });

  test('pressing Escape closes the modal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    const modal = page.locator('#lex-anagram-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveClass(/hidden/);
  });
});

// ── Lex Anagram Coach Modal — Links Section ─────────────────────────────
test.describe('Lex Anagram Coach Modal — Links Section', () => {
  test('links section exists inside the result container', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const linksSection = page.locator('#lex-anagram-links');
    await expect(linksSection).toBeAttached();
  });

  test('links section has "Further Exploration" heading', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const heading = page.locator('#lex-anagram-links p');
    await expect(heading).toContainText('Further Exploration');
  });

  test('contains link to anagram solvers explained blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-anagram-links a[href="/blog/anagram-solvers-explained/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('How Anagram Solvers Work');
  });

  test('contains link to how to spot bingos faster blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-anagram-links a[href="/blog/how-to-spot-bingos-faster/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('How to Spot Bingos Faster');
  });

  test('contains link to bingo training methods blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-anagram-links a[href="/blog/bingo-training-methods/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Bingo Training Methods');
  });

  test('contains link to best scrabble training tools blog post', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-anagram-links a[href="/blog/best-scrabble-training-tools/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Best Scrabble Training Tools');
  });

  test('contains link to anagram history page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#lex-anagram-links a[href="/anagram-history/"]');
    await expect(link).toBeAttached();
    await expect(link).toContainText('Your Anagram History');
  });

  test('all links have trailing slashes', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const links = page.locator('#lex-anagram-links a');
    const count = await links.count();
    expect(count).toBe(5);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/\/$/);
    }
  });
});

// ── Lex Anagram Coach Modal — Negative ──────────────────────────────────
test.describe('Lex Anagram Coach Modal — Negative', () => {
  test('modal is hidden by default on page load', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const modal = page.locator('#lex-anagram-modal');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('no duplicate modals exist on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const modals = page.locator('#lex-anagram-modal');
    await expect(modals).toHaveCount(1);
  });

  test('opening modal does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    // Wait a moment for any async errors
    await page.waitForTimeout(2000);
    expect(errors.filter((e) => e.toLowerCase().includes('lex'))).toHaveLength(0);
  });

  test('modal does not leave body scroll locked after closing', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexAnagram').click();
    await page.locator('#lex-anagram-close').click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('');
  });

  test('re-opening modal shows fresh loading state', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Open and close
    await page.locator('#LexAnagram').click();
    await page.locator('#lex-anagram-loading').waitFor({ state: 'hidden', timeout: 15000 });
    await page.locator('#lex-anagram-close').click();
    // Re-open
    await page.locator('#LexAnagram').click();
    const loading = page.locator('#lex-anagram-loading');
    await expect(loading).toBeVisible();
  });
});
