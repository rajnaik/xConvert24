import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ── Diamond Mine — Positive ─────────────────────────────────────────────────

test.describe('Diamond Mine — Positive', () => {
  test('diamond mine script does NOT run on admin pages', async ({ page }) => {
    // Mock API to always return diamonds — should still not render on admin
    await page.route('**/api/diamond-hunt-claim/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [{ id: 1, diamonds_per_claim: 5, already_claimed: false }],
        }),
      });
    });
    await page.goto(`${BASE}/admin/`);
    await page.waitForTimeout(1500);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('diamond mine gem renders when API returns unclaimed diamond', async ({ page }) => {
    // Set a UID in localStorage before navigating
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-diamond'));

    // Mock the diamond-hunt-claim GET to return an unclaimed diamond
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 42, diamonds_per_claim: 3, already_claimed: false }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
  });

  test('diamond mine gem has correct accessibility attributes', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-a11y'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 10, diamonds_per_claim: 5, already_claimed: false }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await expect(gem).toHaveAttribute('role', 'button');
    await expect(gem).toHaveAttribute('tabindex', '0');
    const label = await gem.getAttribute('aria-label');
    expect(label).toContain('diamond');
    expect(label).toContain('5');
  });

  test('diamond mine gem shows claim success after click', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-claim'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 99, diamonds_per_claim: 2, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 2 }),
        });
      }
    });

    await page.goto(`${BASE}/`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.click();

    // Should show success state
    await expect(gem).toHaveClass(/dm-claimed/, { timeout: 5000 });
    const text = await gem.textContent();
    expect(text).toContain('+2');
  });

  test('diamond mine POST uses trailing slash on API endpoint', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-slash'));

    let postUrl = '';
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 7, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        postUrl = request.url();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 1 }),
        });
      }
    });

    await page.goto(`${BASE}/`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.click();
    await page.waitForTimeout(1000);

    const url = new URL(postUrl);
    expect(url.pathname).toMatch(/\/$/);
  });

  test('diamond mine gem is keyboard accessible (Enter key claims)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-kb'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 55, diamonds_per_claim: 4, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 4 }),
        });
      }
    });

    await page.goto(`${BASE}/`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.focus();
    await page.keyboard.press('Enter');

    await expect(gem).toHaveClass(/dm-claimed/, { timeout: 5000 });
  });
});

// ── Diamond Mine — Negative ─────────────────────────────────────────────────

test.describe('Diamond Mine — Negative', () => {
  test('diamond mine does NOT render on admin pages even with active diamonds', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-admin-neg'));

    await page.route('**/api/diamond-hunt-claim/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [{ id: 1, diamonds_per_claim: 5, already_claimed: false }],
        }),
      });
    });

    await page.goto(`${BASE}/admin/`);
    await page.waitForTimeout(2000);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('diamond mine gem does NOT render when all diamonds already claimed', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-claimed'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 1, diamonds_per_claim: 5, already_claimed: true }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('diamond mine shows "mined" indicator when all diamonds already claimed', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-mined'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 1, diamonds_per_claim: 5, already_claimed: true }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toBeVisible({ timeout: 5000 });
  });

  test('diamond mine "mined" indicator has correct accessibility label', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-mined-a11y'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 2, diamonds_per_claim: 3, already_claimed: true }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toBeVisible({ timeout: 5000 });
    await expect(mined).toHaveAttribute('aria-label', 'Diamonds already mined on this page');
  });

  test('diamond mine "mined" indicator contains mined label text', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-mined-text'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 5, already_claimed: true },
              { id: 2, diamonds_per_claim: 3, already_claimed: true },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toBeVisible({ timeout: 5000 });
    const label = page.locator('.dm-mined-label');
    await expect(label).toContainText('Mined');
  });

  test('diamond mine "mined" indicator persists and does not auto-fade', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-mined-fade'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 1, diamonds_per_claim: 5, already_claimed: true }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toBeVisible({ timeout: 5000 });

    // Wait 10s to confirm element persists (previously auto-faded at 8s)
    await page.waitForTimeout(10000);
    await expect(mined).toBeVisible();
  });

  test('diamond mine "mined" indicator does NOT show on admin pages', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-mined-admin'));

    await page.route('**/api/diamond-hunt-claim/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [{ id: 1, diamonds_per_claim: 5, already_claimed: true }],
        }),
      });
    });

    await page.goto(`${BASE}/admin/`);
    await page.waitForTimeout(2000);
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toHaveCount(0);
  });

  test('diamond mine does NOT render when API returns empty diamonds array', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-empty'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ diamonds: [] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('diamond mine handles claim failure gracefully without page crash', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-fail'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 88, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Already claimed' }),
        });
      }
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.click();

    // Should show error text, not crash
    await page.waitForTimeout(1500);
    const text = await gem.textContent();
    expect(text).toContain('Already claimed');

    // No page errors from diamond mine
    const dmErrors = errors.filter(e => e.toLowerCase().includes('diamond'));
    expect(dmErrors).toHaveLength(0);
  });

  test('diamond mine handles network error gracefully', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-neterr'));

    await page.route('**/api/diamond-hunt-claim/**', route => {
      route.abort('connectionrefused');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    // Should not crash the page
    const dmErrors = errors.filter(e => e.toLowerCase().includes('diamond'));
    expect(dmErrors).toHaveLength(0);

    // Gem should not render since fetch failed
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('no duplicate diamond mine gems on page', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-dup'));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 2, already_claimed: false },
              { id: 2, diamonds_per_claim: 3, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    // Script only shows the FIRST unclaimed diamond, not multiple
    const gems = page.locator('.diamond-mine-gem');
    await expect(gems).toHaveCount(1);
  });
});

// ── Diamond Mine — Anonymous User (no UID) on BlogLayout pages ──────────────
// The BlogLayout diamond script was updated to allow anonymous users (no swf-uid)
// to see diamonds, and auto-create a UID on claim via getOrCreateUid().

const BLOG_PAGE = '/blog/best-two-letter-words-scrabble/';

test.describe('Diamond Mine — Anonymous User (Positive)', () => {
  test('diamond gem renders for anonymous users without UID on blog page', async ({ page }) => {
    // Set up route BEFORE navigation to intercept the initial request
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 50, diamonds_per_claim: 2, already_claimed: false }],
          }),
        });
      } else {
        route.continue();
      }
    });

    // Navigate fresh — no UID set
    const ctx = page.context();
    await ctx.clearCookies();
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}${BLOG_PAGE}`);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
  });

  test('anonymous user GET request omits user_id param on blog page', async ({ page }) => {
    let capturedGetUrl = '';
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        capturedGetUrl = request.url();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 51, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.locator('.diamond-mine-gem').waitFor({ timeout: 5000 });

    // user_id should NOT be in the GET URL when no UID existed
    expect(capturedGetUrl).not.toContain('user_id=');
  });

  test('claiming diamond as anonymous user creates UID in localStorage', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 52, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 1 }),
        });
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}${BLOG_PAGE}`);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });

    // Confirm no UID exists before claim
    const uidBefore = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uidBefore).toBeNull();

    // Click to claim
    await gem.click();
    await page.waitForTimeout(1500);

    // After claim, UID should now exist in localStorage
    const uidAfter = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uidAfter).not.toBeNull();
    expect(uidAfter).toMatch(/^swf-/);
  });

  test('anonymous claim POST sends auto-generated user_id in body', async ({ page }) => {
    let capturedPostBody: any = null;
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 53, diamonds_per_claim: 2, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        capturedPostBody = JSON.parse(request.postData() || '{}');
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 2 }),
        });
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}${BLOG_PAGE}`);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.click();
    await page.waitForTimeout(1500);

    // POST body should contain a user_id that starts with 'swf-'
    expect(capturedPostBody).not.toBeNull();
    expect(capturedPostBody.user_id).toMatch(/^swf-/);
    expect(capturedPostBody.diamond_id).toBe(53);
  });
});

test.describe('Diamond Mine — Anonymous User (Negative)', () => {
  test('anonymous user does not see gem on blog page when API returns empty diamonds', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ diamonds: [] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForTimeout(2000);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('anonymous user does not get UID created if they do not claim', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 54, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}${BLOG_PAGE}`);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });

    // Without clicking — UID should still not exist
    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBeNull();
  });

  test('anonymous user claim does not crash on localStorage write failure', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 55, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 1 }),
        });
      }
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));

    // Override localStorage.setItem to throw before reloading
    await page.evaluate(() => {
      Storage.prototype.setItem = function() { throw new DOMException('QuotaExceededError'); };
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });

    await gem.click();
    await page.waitForTimeout(1500);

    // Should show success (the try/catch in getOrCreateUid handles the error)
    await expect(gem).toHaveClass(/dm-claimed/, { timeout: 5000 });

    // Filter out unrelated adsbygoogle errors
    const diamondErrors = errors.filter(e => !e.includes('adsbygoogle'));
    expect(diamondErrors).toHaveLength(0);
  });
});
