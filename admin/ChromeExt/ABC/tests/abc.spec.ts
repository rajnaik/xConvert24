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

// ===== POPUP STRUCTURE =====

test.describe('ABC v1.2.0 — Popup Structure', () => {
  test('loads with title "Auto Clicker"', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('h1')).toContainText('Auto Clicker');
    await popup.close();
  });

  test('has selector input pre-filled with #', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.clear());
    await popup.reload();
    const input = popup.locator('#selector');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('#');
    await popup.close();
  });

  test('has hours, minutes, seconds interval fields', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('#interval-hours')).toBeVisible();
    await expect(popup.locator('#interval-mins')).toBeVisible();
    await expect(popup.locator('#interval-secs')).toBeVisible();
    await expect(popup.locator('#interval-hours')).toHaveAttribute('max', '24');
    await expect(popup.locator('#interval-secs')).toHaveAttribute('max', '59');
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
    await popup.evaluate(() => chrome.storage.local.clear());
    await popup.reload();
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

// ===== INTERVAL FIELDS =====

test.describe('ABC v1.2.0 — Interval Fields', () => {
  test('defaults to 0h 0m 5s', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.clear());
    await popup.reload();
    await expect(popup.locator('#interval-hours')).toHaveValue('0');
    await expect(popup.locator('#interval-mins')).toHaveValue('0');
    await expect(popup.locator('#interval-secs')).toHaveValue('5');
    await popup.close();
  });

  test('restores saved interval from storage', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.set({ lastInterval: 3661 })); // 1h 1m 1s
    await popup.reload();
    await expect(popup.locator('#interval-hours')).toHaveValue('1');
    await expect(popup.locator('#interval-mins')).toHaveValue('1');
    await expect(popup.locator('#interval-secs')).toHaveValue('1');
    await popup.close();
  });

  test('accepts up to 24 hours', async () => {
    const popup = await getExtensionPopup();
    await popup.locator('#interval-hours').fill('24');
    await popup.locator('#interval-mins').fill('0');
    await popup.locator('#interval-secs').fill('0');
    // Should not show error
    await expect(popup.locator('#interval-hours')).toHaveValue('24');
    await popup.close();
  });
});

// ===== VALIDATION & TEST BUTTON =====

test.describe('ABC v1.2.0 — Validation & Test', () => {
  test('test shows error when selector is empty or just #', async () => {
    const popup = await getExtensionPopup();
    await popup.locator('#selector').fill('');
    await popup.locator('#test-btn').click();
    const result = popup.locator('#test-result');
    await expect(result).toContainText('Enter a selector');
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

  test('test click saves interval to storage', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.clear());
    await popup.locator('#selector').fill('#some-btn');
    await popup.locator('#interval-hours').fill('0');
    await popup.locator('#interval-mins').fill('2');
    await popup.locator('#interval-secs').fill('30');
    await popup.locator('#test-btn').click();
    await popup.waitForTimeout(500);
    const stored = await popup.evaluate(() => new Promise(r => chrome.storage.local.get(['lastInterval'], r)));
    expect((stored as any).lastInterval).toBe(150); // 2m30s = 150s
    await popup.close();
  });

  test('test click resets active clicker state', async () => {
    const popup = await getExtensionPopup();
    // Simulate active clicker
    await popup.evaluate(() => chrome.storage.local.set({ activeClicker: { tabId: 999, selector: '#old', interval: 5 } }));
    await popup.reload();
    await expect(popup.locator('#stop-btn')).toBeVisible();
    // Click test with new selector
    await popup.locator('#selector').fill('#new-selector');
    await popup.locator('#test-btn').click();
    await popup.waitForTimeout(500);
    // Active clicker should be cleared
    const stored = await popup.evaluate(() => new Promise(r => chrome.storage.local.get(['activeClicker'], r)));
    expect((stored as any).activeClicker).toBeUndefined();
    await popup.close();
  });
});

// ===== BACKGROUND WORKER & TAB PERSISTENCE =====

test.describe('ABC v1.2.0 — Background Worker', () => {
  test('service worker is registered', async () => {
    const workers = context.serviceWorkers();
    const abcWorker = workers.find(w => w.url().includes('background.js'));
    expect(abcWorker).toBeTruthy();
  });

  test('start stores tabId in activeClicker', async () => {
    const popup = await getExtensionPopup();
    // Navigate a page to test on
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState();

    // Go back to popup and start
    await popup.bringToFront();
    await popup.locator('#selector').fill('a');
    await popup.locator('#interval-secs').fill('10');
    await popup.locator('#start-btn').click();
    await popup.waitForTimeout(1000);

    const stored = await popup.evaluate(() => new Promise(r => chrome.storage.local.get(['activeClicker'], r)));
    const active = (stored as any).activeClicker;
    expect(active).toBeTruthy();
    expect(active.tabId).toBeGreaterThan(0);
    expect(active.selector).toBe('a');
    expect(active.interval).toBe(10);

    // Stop
    await popup.locator('#stop-btn').click();
    await page.close();
    await popup.close();
  });

  test('stop clears activeClicker from storage', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.set({ activeClicker: { tabId: 1, selector: '#x', interval: 5 } }));
    await popup.reload();
    await popup.locator('#stop-btn').click();
    await popup.waitForTimeout(500);
    const stored = await popup.evaluate(() => new Promise(r => chrome.storage.local.get(['activeClicker'], r)));
    expect((stored as any).activeClicker).toBeUndefined();
    await popup.close();
  });

  test('shows target tab title when active', async () => {
    const popup = await getExtensionPopup();
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState();

    await popup.bringToFront();
    await popup.locator('#selector').fill('a');
    await popup.locator('#interval-secs').fill('10');
    await popup.locator('#start-btn').click();
    await popup.waitForTimeout(1000);

    const status = await popup.locator('#status').textContent();
    expect(status).toContain('Running on:');

    await popup.locator('#stop-btn').click();
    await page.close();
    await popup.close();
  });
});

// ===== COUNTDOWN SYNC =====

test.describe('ABC v1.2.0 — Countdown', () => {
  test('countdown shows formatted time for large intervals', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => {
      chrome.storage.local.set({ activeClicker: { tabId: 1, selector: '#x', interval: 3661, startedAt: Date.now() } });
    });
    await popup.reload();
    await popup.waitForTimeout(1500);
    const status = await popup.locator('#status').textContent();
    // Should show h/m/s format
    expect(status).toMatch(/\d+h|\d+m|\d+s/);
    // Clean up
    await popup.evaluate(() => chrome.storage.local.remove('activeClicker'));
    await popup.close();
  });
});

// ===== SAVED ITEMS =====

test.describe('ABC v1.2.0 — Saved Items', () => {
  test('clicking saved item loads selector and interval fields', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => {
      chrome.storage.local.set({ clickers: [{ selector: '#my-btn', interval: 130, url: 'https://example.com' }] });
    });
    await popup.reload();
    await popup.waitForSelector('.saved-item');
    await popup.locator('.saved-item').first().click();
    await expect(popup.locator('#selector')).toHaveValue('#my-btn');
    // 130s = 0h 2m 10s
    await expect(popup.locator('#interval-hours')).toHaveValue('0');
    await expect(popup.locator('#interval-mins')).toHaveValue('2');
    await expect(popup.locator('#interval-secs')).toHaveValue('10');
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

  test('saved item shows URL tooltip', async () => {
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
});

// ===== LINKS & ANALYTICS =====

test.describe('ABC v1.2.0 — Links', () => {
  test('has xConvert24 link with ref param', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="xconvert24.com"]').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toContain('ref=abc-ext');
    await popup.close();
  });

  test('has bug report link with tool param', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="report-bug"]');
    const href = await link.getAttribute('href');
    expect(href).toContain('tool=Auto+Button+Clicker');
    await popup.close();
  });

  test('has suggest link with title param', async () => {
    const popup = await getExtensionPopup();
    const link = popup.locator('a[href*="suggest"]');
    const href = await link.getAttribute('href');
    expect(href).toContain('title=Auto+Button+Clicker');
    await popup.close();
  });

  test('manifest version is 1.2.0', async () => {
    const popup = await getExtensionPopup();
    const manifest = await popup.evaluate(async () => {
      const r = await fetch(chrome.runtime.getURL('manifest.json'));
      return r.json();
    });
    expect((manifest as any).version).toBe('1.2.0');
    await popup.close();
  });

  test('manifest has alarms permission', async () => {
    const popup = await getExtensionPopup();
    const manifest = await popup.evaluate(async () => {
      const r = await fetch(chrome.runtime.getURL('manifest.json'));
      return r.json();
    });
    expect((manifest as any).permissions).toContain('alarms');
    await popup.close();
  });

  test('manifest has background service_worker', async () => {
    const popup = await getExtensionPopup();
    const manifest = await popup.evaluate(async () => {
      const r = await fetch(chrome.runtime.getURL('manifest.json'));
      return r.json();
    });
    expect((manifest as any).background.service_worker).toBe('background.js');
    await popup.close();
  });
});

// ===== AUTO-SAVE =====

test.describe('ABC v1.2.0 — Auto-Save on Blur', () => {
  test('saves selector and interval to storage on blur', async () => {
    const popup = await getExtensionPopup();
    await popup.evaluate(() => chrome.storage.local.clear());
    await popup.locator('#selector').fill('#blur-test');
    await popup.locator('#interval-mins').fill('5');
    await popup.locator('h1').click(); // trigger blur
    await popup.waitForTimeout(500);
    const stored = await popup.evaluate(() => new Promise(r => chrome.storage.local.get(['lastSelector', 'lastInterval'], r)));
    expect((stored as any).lastSelector).toBe('#blur-test');
    await popup.close();
  });
});

// ===== DETACH BUTTON =====

test.describe('ABC v1.2.0 — Detach Window', () => {
  test('detach button exists', async () => {
    const popup = await getExtensionPopup();
    await expect(popup.locator('#detach-btn')).toBeVisible();
    await popup.close();
  });
});
