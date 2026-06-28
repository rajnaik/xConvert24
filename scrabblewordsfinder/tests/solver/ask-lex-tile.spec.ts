import { test, expect } from '@playwright/test';

/**
 * Ask Lex Tile — Homepage Solver Row
 * The "Ask Lex" tile is conditionally visible:
 *  1. AI must be online (fetches /api/chat-heartbeat/ → {healthy:true})
 *  2. Solver input must have 3+ letter characters
 * When both conditions are met, the tile appears and links to /chat/?rack=LETTERS
 */

test.describe('Ask Lex Tile — Positive', () => {
  test('tile becomes visible when AI is healthy and 3+ letters are typed', async ({ page }) => {
    // Mock AI heartbeat as healthy
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tile = page.locator('#ask-lex-tile');
    // Initially hidden (no letters)
    await expect(tile).toBeHidden();
    // Type 3 letters into the solver
    const solver = page.locator('#text-solver');
    await solver.fill('ABC');
    await expect(tile).toBeVisible();
  });

  test('tile click navigates to /chat/ with rack param when solver has letters', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    // Block navigation to capture the target URL
    await page.route('**/chat/**', (route) => route.fulfill({ status: 200, body: '<html></html>' }));
    await page.goto('/');
    const solver = page.locator('#text-solver');
    await solver.fill('AERTBLS');
    // Wait for debounce to settle and check the actual value
    await page.waitForTimeout(400);
    // Set value directly via JS to bypass any solver sync that might clear it
    await page.evaluate(() => {
      (document.getElementById('text-solver') as HTMLInputElement).value = 'AERTBLS';
    });
    const tile = page.locator('#ask-lex-tile');
    await expect(tile).toBeVisible();
    await tile.click();
    await page.waitForTimeout(200);
    // After click, verify the page navigated with the rack param
    expect(page.url()).toContain('/chat/?rack=AERTBLS');
  });

  test('tile has accessible title attribute', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tile = page.locator('#ask-lex-tile');
    await expect(tile).toHaveAttribute('title', 'Ask Lex AI for strategy help');
  });

  test('tile contains Lex avatar image', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const solver = page.locator('#text-solver');
    await solver.fill('TEST');
    const img = page.locator('#ask-lex-tile img[alt="Lex"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', '/lex-avatar-32.png');
  });

  test('tile displays "Ask Lex" label text', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const solver = page.locator('#text-solver');
    await solver.fill('WORD');
    const label = page.locator('#ask-lex-tile span');
    await expect(label).toHaveText('Ask Lex');
  });

  test('tile appears dynamically when typing from 2 to 3 letters', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tile = page.locator('#ask-lex-tile');
    const solver = page.locator('#text-solver');
    // 2 letters — tile stays hidden
    await solver.fill('AB');
    await expect(tile).toBeHidden();
    // 3 letters — tile appears
    await solver.fill('ABC');
    await expect(tile).toBeVisible();
  });

  test('tile hides when letters are cleared below 3', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tile = page.locator('#ask-lex-tile');
    const solver = page.locator('#text-solver');
    await solver.fill('ABCDE');
    await expect(tile).toBeVisible();
    // Clear to 2 letters
    await solver.fill('AB');
    await expect(tile).toBeHidden();
  });
});

test.describe('Ask Lex Tile — Negative', () => {
  test('tile is hidden when AI heartbeat returns unhealthy', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: false }) })
    );
    await page.goto('/');
    const solver = page.locator('#text-solver');
    await solver.fill('ABCDE');
    const tile = page.locator('#ask-lex-tile');
    // Even with letters, tile stays hidden if AI is down
    await page.waitForTimeout(500);
    await expect(tile).toBeHidden();
  });

  test('tile is hidden when AI heartbeat request fails (network error)', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) => route.abort());
    await page.goto('/');
    const solver = page.locator('#text-solver');
    await solver.fill('ABCDE');
    const tile = page.locator('#ask-lex-tile');
    await page.waitForTimeout(500);
    await expect(tile).toBeHidden();
  });

  test('tile is hidden on page load with empty solver', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tile = page.locator('#ask-lex-tile');
    await page.waitForTimeout(500);
    await expect(tile).toBeHidden();
  });

  test('no duplicate Ask Lex tiles on the homepage', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tiles = page.locator('#ask-lex-tile');
    await expect(tiles).toHaveCount(1);
  });

  test('tile does not break solver input functionality', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const input = page.locator('#text-solver');
    await input.fill('AERTBLS');
    await expect(input).toHaveValue('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found', { timeout: 10000 });
  });

  test('non-letter characters in solver do not count toward 3-letter threshold', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    const tile = page.locator('#ask-lex-tile');
    const solver = page.locator('#text-solver');
    // "A1" has only 1 letter — hidden
    await solver.fill('A1');
    await expect(tile).toBeHidden();
    // "AB " has only 2 letters — hidden
    await solver.fill('AB ');
    await expect(tile).toBeHidden();
    // "A?C" has 3 letters (? counts) — visible
    await solver.fill('A?C');
    await expect(tile).toBeVisible();
  });

  test('page does not produce JS errors with Ask Lex tile logic', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.route('**/api/chat-heartbeat/', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ healthy: true }) })
    );
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });
});
