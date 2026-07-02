import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;
const API_URL = `${BASE_URL}/api/memorised-words/`;

// ── WOTD Memorised Checkbox — Positive ───────────────────────────────────────

test.describe('WOTD Memorised Checkbox — Positive', () => {
  test('memorised checkbox is visible on the WOTD panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const checkbox = page.locator('#wotd-memorised-checkbox');
    await expect(checkbox).toBeVisible();
  });

  test('memorised label text says "Memorised"', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const label = page.locator('#wotd-memorised-label');
    await expect(label).toContainText('Memorised');
  });

  test('checkbox starts unchecked for a fresh user', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Wait for WOTD to load
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent && el.textContent !== '—' && el.textContent !== '...';
    }, { timeout: 5000 }).catch(() => {});
    const checkbox = page.locator('#wotd-memorised-checkbox');
    // Fresh page with no prior memorised state — should be unchecked
    await expect(checkbox).not.toBeChecked();
  });

  test('checking the checkbox calls the API and persists', async ({ page }) => {
    // Set a test UID in localStorage so the handler fires
    await page.goto(ACTIVITIES_URL);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'playwright-memorised-test'));
    await page.reload();

    // Wait for WOTD word to load
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent && el.textContent !== '—' && el.textContent !== '...';
    }, { timeout: 5000 });

    const checkbox = page.locator('#wotd-memorised-checkbox');

    // Listen for the API call
    const apiPromise = page.waitForResponse(
      resp => resp.url().includes('/api/memorised-words/') && resp.request().method() === 'POST'
    );

    await checkbox.check();
    const response = await apiPromise;
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.word).toBeTruthy();
  });
});

// ── WOTD Memorised Checkbox — Negative ───────────────────────────────────────

test.describe('WOTD Memorised Checkbox — Negative', () => {
  test('only one memorised checkbox exists on the activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const checkboxes = page.locator('#wotd-memorised-checkbox');
    await expect(checkboxes).toHaveCount(1);
  });

  test('unchecking calls DELETE and removes the word', async ({ page }) => {
    // Set a test UID in localStorage so the handler fires
    await page.goto(ACTIVITIES_URL);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'playwright-memorised-test'));
    await page.reload();

    // Wait for WOTD word to load
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent && el.textContent !== '—' && el.textContent !== '...';
    }, { timeout: 5000 });

    const checkbox = page.locator('#wotd-memorised-checkbox');

    // First check it
    if (!(await checkbox.isChecked())) {
      const postPromise = page.waitForResponse(
        resp => resp.url().includes('/api/memorised-words/') && resp.request().method() === 'POST'
      );
      await checkbox.check();
      await postPromise;
    }

    // Now uncheck — should call DELETE
    const deletePromise = page.waitForResponse(
      resp => resp.url().includes('/api/memorised-words/') && resp.request().method() === 'DELETE'
    );
    await checkbox.uncheck();
    const response = await deletePromise;
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('no JS errors when interacting with memorised checkbox', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'playwright-memorised-test'));
    await page.reload();
    await page.waitForFunction(() => {
      const el = document.getElementById('wotd-word');
      return el && el.textContent && el.textContent !== '—' && el.textContent !== '...';
    }, { timeout: 5000 }).catch(() => {});

    const checkbox = page.locator('#wotd-memorised-checkbox');
    await checkbox.check();
    await page.waitForTimeout(500);
    await checkbox.uncheck();
    await page.waitForTimeout(500);

    expect(errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('referenceerror')
    )).toHaveLength(0);
  });
});

// ── API Endpoint — Positive ───────────────────────────────────────

test.describe('Memorised Words API — Positive', () => {
  test('POST creates a memorised word entry', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: { userid: 'playwright-test-user', word: 'ZEPHYR' }
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.word).toBe('ZEPHYR');
  });

  test('GET returns memorised words for a user', async ({ request }) => {
    // Ensure there's a word
    await request.post(API_URL, {
      data: { userid: 'playwright-test-user', word: 'THRIVE' }
    });

    const response = await request.get(`${API_URL}?userid=playwright-test-user`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.words).toBeDefined();
    expect(body.words.length).toBeGreaterThanOrEqual(1);
    const words = body.words.map((w: any) => w.word);
    expect(words).toContain('THRIVE');
  });

  test('DELETE removes a memorised word', async ({ request }) => {
    // Ensure it exists
    await request.post(API_URL, {
      data: { userid: 'playwright-test-user', word: 'EPHEMERAL' }
    });

    const response = await request.delete(API_URL, {
      data: { userid: 'playwright-test-user', word: 'EPHEMERAL' }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Verify it's gone
    const getResponse = await request.get(`${API_URL}?userid=playwright-test-user`);
    const getBody = await getResponse.json();
    const words = getBody.words.map((w: any) => w.word);
    expect(words).not.toContain('EPHEMERAL');
  });
});

// ── API Endpoint — Negative ───────────────────────────────────────

test.describe('Memorised Words API — Negative', () => {
  test('POST without userid returns 400', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: { word: 'TEST' }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('userid');
  });

  test('POST without word returns 400', async ({ request }) => {
    const response = await request.post(API_URL, {
      data: { userid: 'test-user' }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('word');
  });

  test('GET without userid returns 400', async ({ request }) => {
    const response = await request.get(API_URL);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('userid');
  });

  test('duplicate POST does not create duplicate entry', async ({ request }) => {
    await request.post(API_URL, {
      data: { userid: 'playwright-test-user', word: 'UNIQUE' }
    });
    // Post same word again
    const response = await request.post(API_URL, {
      data: { userid: 'playwright-test-user', word: 'UNIQUE' }
    });
    expect(response.status()).toBe(201); // Still succeeds (INSERT OR IGNORE)

    // Should only have one entry
    const getResponse = await request.get(`${API_URL}?userid=playwright-test-user`);
    const body = await getResponse.json();
    const uniqueCount = body.words.filter((w: any) => w.word === 'UNIQUE').length;
    expect(uniqueCount).toBe(1);
  });
});
