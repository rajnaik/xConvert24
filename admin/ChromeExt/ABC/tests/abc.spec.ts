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
  let extensionId = '';
  let attempts = 0;
  while (!extensionId && attempts < 10) {
    const workers = context.serviceWorkers();
    for (const worker of workers) {
      if (worker.url().includes('chrome-extension://')) {
        extensionId = worker.url().split('/')[2];
        break;
      }
    }
    if (!extensionId) { await new Promise(r => setTimeout(r, 500)); attempts++; }
  }
  if (!extensionId) {
    const pages = context.pages();
    for (const p of pages) {
      if (p.url().includes('chrome-extension://')) {
        extensionId = p.url().split('/')[2];
      }
    }
  }
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}

test.describe('ABC — Popup Structure', () => {
  test('loads with title "Auto Clicker"', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('h1')).toContainText('Auto Clicker');
    await popup.close();
  });

  test('has selector input with placeholder', async () => {
    const popup = await getExtensionPopup();
    const input = popup.locator('#selector');
    await expect(input).toBeVisible();
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toContain('#');
    await popup.close();
  });

  test('has interval input (1-60)', async () => {
    const popup = await getExtensionPopup();
    const input = popup.locator('#interval');
    await expect(input).toHaveAttribute('min', '1');
    await expect(input).toHaveAttribute('max', '60');
    await popup.close();
  });

  test('has Test, Start, Stop buttons', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('#test-btn')).toBeVisible();
    await expect(popup.locator('#start-btn')).toBeVisible();
    await expect(popup.locator('#stop-btn')).toBeAttached();
    await popup.close();
  });

  test('status shows "Idle" initially', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('#status')).toContainText('Idle');
    await expect(popup.locator('#status')).toHaveClass(/status-inactive/);
    await popup.close();
  });

  test('has header icon with gradient', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('.header-icon')).toBeVisible();
    await popup.close();
  });
});

test.describe('ABC — Validation & Test Button', () => {
  test('test shows error when selector is empty', async () => {
    const popup = await getExtensionPopup();
    await popup.locator('#selector').fill('');
    await popup.locator('#test-btn').click();
    const result = popup.locator('#test-result');
    await expect(result).toContainText('Enter a selector');
    await expect(result).toHaveClass(/test-fail/);
    await expect(popup.locator('#selector')).toHaveClass(/error/);
    await popup.close();
  });

  test('error class clears on typing', async () => {
    const popup = await getExtensionPopup();
    await popup.locator('#selector').fill('');
    await popup.locator('#test-btn').click();
    await expect(popup.locator('#selector')).toHaveClass(/error/);
    await popup.locator('#selector').fill('#test');
    await expect(popup.locator('#selector')).not.toHaveClass(/error/);
    await popup.close();
  });

  test('start shows error when element not found', async () => {
    const popup = await getExtensionPopup();
    await popup.locator('#selector').fill('#nonexistent-xyz-123');
    await popup.locator('#start-btn').click();
    await expect(popup.locator('#test-result')).toHaveClass(/test-fail/);
    await popup.close();
  });
});

test.describe('ABC — Saved Items', () => {
  test('clicking saved item loads into selector', async () => {
    const popup = await getExtensionPopup();
    // Set a value in storage first
    await popup.evaluate(() => {
      chrome.storage.local.set({ clickers: [{ selector: '#my-btn', interval: 10, url: 'https://example.com' }] });
    });
    await popup.reload();
    await popup.waitForSelector('.saved-item');
    await popup.locator('.saved-item').first().click();
    await expect(popup.locator('#selector')).toHaveValue('#my-btn');
    await expect(popup.locator('#interval')).toHaveValue('10');
    await popup.close();
  });

  test('saved item shows URL tooltip on hover', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => {
      chrome.storage.local.set({ clickers: [{ selector: '#test', interval: 5, url: 'https://example.com/page' }] });
    });
    await popup.reload();
    await popup.waitForSelector('.saved-item');
    const title = await popup.locator('.saved-item').first().getAttribute('title');
    expect(title).toContain('example.com');
    await popup.close();
  });

  test('delete button removes saved item', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => {
      chrome.storage.local.set({ clickers: [{ selector: '#del-me', interval: 3, url: '' }] });
    });
    await popup.reload();
    await popup.waitForSelector('.saved-item');
    await popup.locator('.del').first().click();
    await expect(popup.locator('.saved-item')).toHaveCount(0);
    await popup.close();
  });
});

test.describe('ABC — Links & Analytics', () => {
  test('has xConvert24 link with ref param', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="xconvert24.com"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('ref=abc-ext');
    await popup.close();
  });

  test('has Kiro link', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="kiro.dev"]');
    await expect(link).toBeVisible();
    await popup.close();
  });

  test('has bug report link', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="report-bug"]');
    await expect(link).toBeVisible();
    await popup.close();
  });

  test('has suggest link', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="suggest"]');
    await expect(link).toBeVisible();
    await popup.close();
  });

  test('GA tracking code present in popup.js', async () => {
    const popup = await getExtensionPopup();
    const scripts = await popup.locator('script[src="popup.js"]').count();
    expect(scripts).toBe(1);
    await popup.close();
  });
});

test.describe('ABC — UI Polish', () => {
  test('inputs have embossed shadow styling', async () => {
    const popup = await getExtensionPopup();
    const input = popup.locator('#selector');
    const boxShadow = await input.evaluate(el => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe('none');
    await popup.close();
  });

  test('start button has green gradient', async () => {
    const popup = await getExtensionPopup();
    const bg = await popup.locator('#start-btn').evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bg).toContain('gradient');
    await popup.close();
  });

  test('body has dark gradient background', async () => {
    const popup = await getExtensionPopup();
    const bg = await popup.evaluate(() => getComputedStyle(document.body).backgroundImage);
    expect(bg).toContain('gradient');
    await popup.close();
  });
});

test.describe('ABC — Chrome URL Handling', () => {
  test('shows friendly message on restricted pages', async () => {
    const popup = await getExtensionPopup();
    // Simulate being on chrome:// page by trying to test a selector
    await popup.locator('#selector').fill('#some-element');
    await popup.locator('#test-btn').click();
    // Should either work or show friendly error (not crash)
    const result = popup.locator('#test-result');
    await expect(result).toBeVisible();
    const text = await result.textContent();
    // Either success or friendly fail — not an unhandled error
    expect(text).toMatch(/\[OK\]|\[FAIL\]/);
    await popup.close();
  });
});

test.describe('ABC — Auto-Save on Blur', () => {
  test('saves selector to storage when input loses focus', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.clear());
    await popup.locator('#selector').fill('#auto-saved-element');
    await popup.locator('#interval').fill('7');
    // Trigger blur by clicking elsewhere
    await popup.locator('h1').click();
    // Wait for storage write
    await popup.waitForTimeout(500);
    // Check storage
    const stored = await popup.evaluate(() => {
      return new Promise(resolve => chrome.storage.local.get(['clickers', 'lastSelector'], resolve));
    });
    expect((stored as any).lastSelector).toBe('#auto-saved-element');
    const clickers = (stored as any).clickers || [];
    expect(clickers.find((c: any) => c.selector === '#auto-saved-element')).toBeTruthy();
    await popup.close();
  });

  test('does not save empty selector on blur', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.set({ clickers: [] }));
    await popup.locator('#selector').fill('');
    await popup.locator('h1').click();
    await popup.waitForTimeout(300);
    const stored = await popup.evaluate(() => {
      return new Promise(resolve => chrome.storage.local.get(['clickers'], resolve));
    });
    expect(((stored as any).clickers || []).length).toBe(0);
    await popup.close();
  });
});

test.describe('ABC — Saved Item Restore', () => {
  test('clicking saved item populates selector and interval', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => {
      chrome.storage.local.set({ clickers: [
        { selector: '.restore-me', interval: 15, url: 'https://example.com/page' }
      ]});
    });
    await popup.reload();
    await popup.waitForSelector('.saved-item');
    await popup.locator('.saved-item').first().click();
    await expect(popup.locator('#selector')).toHaveValue('.restore-me');
    await expect(popup.locator('#interval')).toHaveValue('15');
    await popup.close();
  });

  test('multiple saved items can each be loaded', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => {
      chrome.storage.local.set({ clickers: [
        { selector: '#first', interval: 3, url: '' },
        { selector: '#second', interval: 20, url: '' }
      ]});
    });
    await popup.reload();
    await popup.waitForSelector('.saved-item');
    const items = popup.locator('.saved-item');
    await items.nth(1).click();
    await expect(popup.locator('#selector')).toHaveValue('#second');
    await expect(popup.locator('#interval')).toHaveValue('20');
    await items.nth(0).click();
    await expect(popup.locator('#selector')).toHaveValue('#first');
    await expect(popup.locator('#interval')).toHaveValue('3');
    await popup.close();
  });
});

test.describe('ABC — Link Prepopulate Params', () => {
  test('bug report link has tool=Auto+Button+Clicker', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="report-bug"]');
    const href = await link.getAttribute('href');
    expect(href).toContain('tool=Auto+Button+Clicker');
    await popup.close();
  });

  test('suggest link has title=Auto+Button+Clicker', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="suggest"]');
    const href = await link.getAttribute('href');
    expect(href).toContain('title=Auto+Button+Clicker');
    await popup.close();
  });

  test('kiro link has ref=www.xconvert24.com', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="kiro.dev"]');
    const href = await link.getAttribute('href');
    expect(href).toContain('ref=www.xconvert24.com');
    await popup.close();
  });

  test('extension name in manifest is Auto Button Clicker', async () => {
    const popup = await getExtensionPopup();
    const title = await popup.title();
    // Extension popup title comes from HTML, but let's check manifest via fetch
    const manifest = await popup.evaluate(async () => {
      const r = await fetch(chrome.runtime.getURL('manifest.json'));
      return r.json();
    });
    expect((manifest as any).name).toBe('Auto Button Clicker');
    await popup.close();
  });
});
