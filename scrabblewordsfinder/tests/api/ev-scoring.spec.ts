import { test, expect } from '@playwright/test';

/**
 * EV Scoring Engine Tests — /chat/ page
 * Tests the rack quality EV score badge that appears when tiles are entered
 * in the Ask Lex rack input on the chat page.
 */

test.describe('EV Scoring — Chat Page — Positive', () => {
  test('EV score badge is hidden by default (no rack)', async ({ page }) => {
    await page.goto('/chat/');
    const badge = page.locator('#ev-score-badge');
    await expect(badge).toBeHidden();
  });

  test('EV score badge appears when rack letters are typed', async ({ page }) => {
    await page.goto('/chat/');
    // Clear any persisted rack from localStorage
    await page.evaluate(() => localStorage.removeItem('swf-chat-rack'));
    await page.reload();

    const rackInput = page.locator('#rack-input');
    await rackInput.fill('SATIRE');
    // Trigger input event (fill doesn't always fire input on custom handlers)
    await rackInput.dispatchEvent('input');

    const badge = page.locator('#ev-score-badge');
    await expect(badge).toBeVisible();
  });

  test('EV score value shows X/100 format', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('AEILNRT');
    await rackInput.dispatchEvent('input');

    const scoreValue = page.locator('#ev-score-value');
    await expect(scoreValue).toBeVisible();
    const text = await scoreValue.textContent();
    expect(text).toMatch(/^\d+\/100$/);
  });

  test('EV score label shows quality label (Excellent/Strong/Decent/Weak/Poor)', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('SATIRE');
    await rackInput.dispatchEvent('input');

    const label = page.locator('#ev-score-label');
    await expect(label).toBeVisible();
    const text = await label.textContent();
    expect(['Excellent', 'Strong', 'Decent', 'Weak', 'Poor']).toContain(text);
  });

  test('EV score fill bar has non-zero width for valid rack', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('RETINAS');
    await rackInput.dispatchEvent('input');

    const fill = page.locator('#ev-score-fill');
    const style = await fill.getAttribute('style');
    expect(style).not.toContain('width: 0%');
    expect(style).not.toContain('width:0%');
  });

  test('high quality rack (SATIREN) scores 65+ (Strong or Excellent)', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('SATIREN');
    await rackInput.dispatchEvent('input');

    const scoreValue = page.locator('#ev-score-value');
    const text = await scoreValue.textContent();
    const score = parseInt(text || '0');
    expect(score).toBeGreaterThanOrEqual(65);
  });

  test('poor rack (QQQZZZV) scores below 25', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('QQQZZZV');
    await rackInput.dispatchEvent('input');

    const scoreValue = page.locator('#ev-score-value');
    const text = await scoreValue.textContent();
    const score = parseInt(text || '999');
    expect(score).toBeLessThan(25);
  });

  test('EV score updates as user types more letters', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');

    // Type 2 letters
    await rackInput.fill('SA');
    await rackInput.dispatchEvent('input');
    const scoreAfter2 = await page.locator('#ev-score-value').textContent();

    // Type 7 letters (better rack)
    await rackInput.fill('SATIREN');
    await rackInput.dispatchEvent('input');
    const scoreAfter7 = await page.locator('#ev-score-value').textContent();

    // Scores should be different (more context = different score)
    expect(scoreAfter2).not.toEqual(scoreAfter7);
  });

  test('EV score persists on page reload via localStorage', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('AEILNR');
    await rackInput.dispatchEvent('input');

    // Reload
    await page.reload();

    // Badge should still be visible (rack persisted)
    const badge = page.locator('#ev-score-badge');
    await expect(badge).toBeVisible();
    const scoreValue = page.locator('#ev-score-value');
    const text = await scoreValue.textContent();
    expect(text).toMatch(/^\d+\/100$/);
  });
});

test.describe('EV Scoring — Chat Page — Negative', () => {
  test('EV score badge hides when rack is cleared', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');

    // Type then clear
    await rackInput.fill('SATIRE');
    await rackInput.dispatchEvent('input');
    await expect(page.locator('#ev-score-badge')).toBeVisible();

    await rackInput.fill('');
    await rackInput.dispatchEvent('input');
    await expect(page.locator('#ev-score-badge')).toBeHidden();
  });

  test('rack input rejects non-letter characters', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('123!@#');
    await rackInput.dispatchEvent('input');

    // Input should be empty (only letters allowed)
    const value = await rackInput.inputValue();
    expect(value).toBe('');
  });

  test('rack input enforces max 7 characters', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('ABCDEFGHIJ');
    await rackInput.dispatchEvent('input');

    const value = await rackInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(7);
  });

  test('no duplicate EV badge elements exist', async ({ page }) => {
    await page.goto('/chat/');
    const badges = page.locator('#ev-score-badge');
    expect(await badges.count()).toBe(1);
  });

  test('EV score does not crash with single letter', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('A');
    await rackInput.dispatchEvent('input');

    // Should not error — page still functional
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(300);
    expect(errors.filter(e => e.includes('EV') || e.includes('ev'))).toHaveLength(0);
  });

  test('EV fill bar colour matches label (no mismatch)', async ({ page }) => {
    await page.goto('/chat/');
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('SATIRE');
    await rackInput.dispatchEvent('input');

    const fill = page.locator('#ev-score-fill');
    const label = page.locator('#ev-score-label');

    const fillClass = await fill.getAttribute('class') || '';
    const labelText = await label.textContent();

    // Colour mapping sanity check
    if (labelText === 'Excellent') expect(fillClass).toContain('emerald');
    else if (labelText === 'Strong') expect(fillClass).toContain('green');
    else if (labelText === 'Decent') expect(fillClass).toContain('amber');
    else if (labelText === 'Weak') expect(fillClass).toContain('orange');
    else if (labelText === 'Poor') expect(fillClass).toContain('red');
  });
});
