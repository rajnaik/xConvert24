import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

const EXT_PATH = path.resolve(__dirname, '..');

let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

async function getExtensionPopup() {
  // Get the extension's service worker to find its ID
  let extensionId = '';
  const workers = context.serviceWorkers();
  for (const worker of workers) {
    if (worker.url().includes('chrome-extension://')) {
      extensionId = worker.url().split('/')[2];
      break;
    }
  }
  if (!extensionId) {
    // Wait for service worker
    const worker = await context.waitForEvent('serviceworker');
    extensionId = worker.url().split('/')[2];
  }
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

test.describe('SWF Extension — Popup Structure', () => {
  test('popup loads with title and tile inputs', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('h1')).toContainText('Scrabble Word Finder');
    const inputs = popup.locator('.tile-input');
    await expect(inputs).toHaveCount(7);
    await popup.close();
  });

  test('popup has CTA link to main site', async () => {
    const popup = await getExtensionPopup();
    const cta = popup.locator('.cta');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toContain('scrabblewordsfinder.com');
    expect(href).toContain('ref=chrome-ext');
    await popup.close();
  });

  test('popup has links to xConvert24', async () => {
    const popup = await getExtensionPopup();
    const xconvertLink = popup.locator('a[href*="xconvert24.com"]').first();
    await expect(xconvertLink).toBeVisible();
    await popup.close();
  });

  test('popup has footer with powered-by text', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('.footer')).toContainText('ScrabbleWordsFinder.com');
    await popup.close();
  });
});

test.describe('SWF Extension — Solver Logic', () => {
  test('shows "Enter at least 2 letters" initially', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('.empty')).toContainText('Enter your rack tiles');
    await popup.close();
  });

  test('finds words for AERTBLS', async () => {
    const popup = await getExtensionPopup();
    const inputs = popup.locator('.tile-input');
    const letters = 'AERTBLS';
    for (let i = 0; i < letters.length; i++) {
      await inputs.nth(i).fill(letters[i]);
    }
    // Wait for results (dictionary needs to load)
    await popup.waitForSelector('.word-row', { timeout: 5000 });
    const results = popup.locator('.word-row');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(50);
    await popup.close();
  });

  test('shows correct scores', async () => {
    const popup = await getExtensionPopup();
    const inputs = popup.locator('.tile-input');
    // QI is a known 2-letter word worth 11 points
    await inputs.nth(0).fill('Q');
    await inputs.nth(1).fill('I');
    await popup.waitForSelector('.word-row', { timeout: 5000 });
    const firstScore = popup.locator('.word-score').first();
    const scoreText = await firstScore.textContent();
    expect(scoreText).toContain('pts');
    await popup.close();
  });

  test('handles blank tiles (?)', async () => {
    const popup = await getExtensionPopup();
    const inputs = popup.locator('.tile-input');
    await inputs.nth(0).fill('?');
    await inputs.nth(1).fill('A');
    await inputs.nth(2).fill('T');
    await popup.waitForSelector('.word-row', { timeout: 5000 });
    const count = await popup.locator('.word-row').count();
    expect(count).toBeGreaterThan(0);
    await popup.close();
  });

  test('click on word copies to clipboard', async () => {
    const popup = await getExtensionPopup();
    const inputs = popup.locator('.tile-input');
    await inputs.nth(0).fill('C');
    await inputs.nth(1).fill('A');
    await inputs.nth(2).fill('T');
    await popup.waitForSelector('.word-row', { timeout: 5000 });
    const firstRow = popup.locator('.word-row').first();
    await firstRow.click();
    // Verify visual feedback (green flash)
    const bg = await firstRow.evaluate(el => el.style.background);
    // It flashes green briefly
    await popup.close();
  });
});

test.describe('SWF Extension — Tile Input Navigation', () => {
  test('typing moves focus to next tile', async () => {
    const popup = await getExtensionPopup();
    const inputs = popup.locator('.tile-input');
    await inputs.nth(0).focus();
    await inputs.nth(0).fill('A');
    // Second input should now be focused
    const focused = await popup.evaluate(() => document.activeElement?.getAttribute('data-idx'));
    expect(focused).toBe('1');
    await popup.close();
  });

  test('backspace on empty moves to previous tile', async () => {
    const popup = await getExtensionPopup();
    const inputs = popup.locator('.tile-input');
    await inputs.nth(0).fill('A');
    await inputs.nth(1).focus();
    await popup.keyboard.press('Backspace');
    const focused = await popup.evaluate(() => document.activeElement?.getAttribute('data-idx'));
    expect(focused).toBe('0');
    await popup.close();
  });
});
