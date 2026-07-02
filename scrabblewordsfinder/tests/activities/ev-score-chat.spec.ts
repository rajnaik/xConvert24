import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const CHAT_URL = `${BASE_URL}/chat/`;

/**
 * EV Scoring Engine — Chat Page Integration
 * When the user types rack letters into #rack-input on /chat/,
 * an EV score badge (#ev-score-badge) appears showing the rack quality (0-100).
 */

test.describe('EV Score Badge — Positive', () => {
  test('EV score badge appears when rack letters are typed', async ({ page }) => {
    await page.goto(CHAT_URL);

    const rackInput = page.locator('#rack-input');
    const evBadge = page.locator('#ev-score-badge');

    // Initially hidden
    await expect(evBadge).toBeHidden();

    // Type a rack
    await rackInput.fill('SATIRE');
    await rackInput.dispatchEvent('input');

    await expect(evBadge).toBeVisible();
  });

  test('EV score shows a numeric value out of 100', async ({ page }) => {
    await page.goto(CHAT_URL);

    await page.locator('#rack-input').fill('AEILNRT');
    await page.locator('#rack-input').dispatchEvent('input');

    const scoreText = await page.locator('#ev-score-value').textContent();
    expect(scoreText).toMatch(/^\d+\/100$/);
  });

  test('EV score shows a quality label', async ({ page }) => {
    await page.goto(CHAT_URL);

    await page.locator('#rack-input').fill('AEILNRT');
    await page.locator('#rack-input').dispatchEvent('input');

    const label = await page.locator('#ev-score-label').textContent();
    expect(['Excellent', 'Strong', 'Decent', 'Weak', 'Poor']).toContain(label);
  });

  test('EV score progress bar has non-zero width for valid rack', async ({ page }) => {
    await page.goto(CHAT_URL);

    await page.locator('#rack-input').fill('RETINAS');
    await page.locator('#rack-input').dispatchEvent('input');

    const fill = page.locator('#ev-score-fill');
    const width = await fill.evaluate(el => el.style.width);
    expect(width).not.toBe('0%');
  });

  test('excellent rack (SATIRES with S) scores 65+', async ({ page }) => {
    await page.goto(CHAT_URL);

    await page.locator('#rack-input').fill('SATIRES');
    await page.locator('#rack-input').dispatchEvent('input');

    const scoreText = await page.locator('#ev-score-value').textContent();
    const score = parseInt(scoreText!.split('/')[0], 10);
    expect(score).toBeGreaterThanOrEqual(65);
  });

  test('EV score updates live as letters change', async ({ page }) => {
    await page.goto(CHAT_URL);

    const rackInput = page.locator('#rack-input');

    // First rack
    await rackInput.fill('QQQ');
    await rackInput.dispatchEvent('input');
    const score1 = await page.locator('#ev-score-value').textContent();

    // Change to better rack
    await rackInput.fill('SATIRE');
    await rackInput.dispatchEvent('input');
    const score2 = await page.locator('#ev-score-value').textContent();

    // Scores should differ (SATIRE is much better than QQQ)
    expect(score1).not.toBe(score2);
  });

  test('EV score persists on page reload via localStorage rack', async ({ page }) => {
    await page.goto(CHAT_URL);

    // Set rack and trigger input
    await page.locator('#rack-input').fill('LINERS');
    await page.locator('#rack-input').dispatchEvent('input');

    // Reload — the rack is persisted in localStorage, EV should show on load
    await page.reload();

    const evBadge = page.locator('#ev-score-badge');
    await expect(evBadge).toBeVisible();

    const scoreText = await page.locator('#ev-score-value').textContent();
    expect(scoreText).toMatch(/^\d+\/100$/);
  });
});

test.describe('EV Score Badge — Negative', () => {
  test('EV badge is hidden when rack is empty', async ({ page }) => {
    // Clear any persisted rack
    await page.addInitScript(() => {
      localStorage.removeItem('swf-chat-rack');
    });

    await page.goto(CHAT_URL);

    const evBadge = page.locator('#ev-score-badge');
    await expect(evBadge).toBeHidden();
  });

  test('EV badge hides when rack is cleared', async ({ page }) => {
    await page.goto(CHAT_URL);

    // Type then clear
    await page.locator('#rack-input').fill('TEST');
    await page.locator('#rack-input').dispatchEvent('input');
    await expect(page.locator('#ev-score-badge')).toBeVisible();

    await page.locator('#rack-input').fill('');
    await page.locator('#rack-input').dispatchEvent('input');
    await expect(page.locator('#ev-score-badge')).toBeHidden();
  });

  test('no duplicate EV score badges exist', async ({ page }) => {
    await page.goto(CHAT_URL);

    const badges = page.locator('#ev-score-badge');
    await expect(badges).toHaveCount(1);
  });

  test('EV score does not cause JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(CHAT_URL);

    await page.locator('#rack-input').fill('ZXQJKVW');
    await page.locator('#rack-input').dispatchEvent('input');

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('poor rack (all duplicates) scores below 30', async ({ page }) => {
    await page.goto(CHAT_URL);

    await page.locator('#rack-input').fill('AAAAAAA');
    await page.locator('#rack-input').dispatchEvent('input');

    const scoreText = await page.locator('#ev-score-value').textContent();
    const score = parseInt(scoreText!.split('/')[0], 10);
    expect(score).toBeLessThan(30);
  });
});


test.describe('Memorise with Memory WordBench Button — Positive', () => {
  test('MWB modal-open button is visible on the chat page', async ({ page }) => {
    await page.goto(CHAT_URL);
    const btn = page.locator('#mwb-modal-open');
    await expect(btn).toBeVisible();
  });

  test('MWB button is a <button> element with type="button"', async ({ page }) => {
    await page.goto(CHAT_URL);
    const btn = page.locator('#mwb-modal-open');
    const tagName = await btn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('button');
    const type = await btn.getAttribute('type');
    expect(type).toBe('button');
  });

  test('MWB button contains correct text', async ({ page }) => {
    await page.goto(CHAT_URL);
    const btn = page.locator('#mwb-modal-open');
    const text = await btn.textContent();
    expect(text).toContain('Memorise with Memory WordBench');
  });

  test('MWB button has brain emoji with aria-hidden', async ({ page }) => {
    await page.goto(CHAT_URL);
    const emoji = page.locator('#mwb-modal-open span[aria-hidden="true"]');
    await expect(emoji).toBeAttached();
    const text = await emoji.textContent();
    expect(text).toContain('🧠');
  });

  test('MWB button has purple styling classes', async ({ page }) => {
    await page.goto(CHAT_URL);
    const btn = page.locator('#mwb-modal-open');
    const cls = await btn.getAttribute('class');
    expect(cls).toContain('border-purple-500/40');
    expect(cls).toContain('text-purple-300');
  });
});

test.describe('Memorise with Memory WordBench Button — Negative', () => {
  test('no duplicate MWB modal-open buttons on the page', async ({ page }) => {
    await page.goto(CHAT_URL);
    const buttons = page.locator('#mwb-modal-open');
    const count = await buttons.count();
    expect(count).toBe(1);
  });

  test('MWB button click does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(CHAT_URL);
    await page.locator('#mwb-modal-open').click();
    await page.waitForTimeout(1000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('MWB button click does not navigate away from chat page', async ({ page }) => {
    await page.goto(CHAT_URL);
    await page.locator('#mwb-modal-open').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/chat/');
  });
});
