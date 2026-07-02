import { test, expect } from '@playwright/test';

/**
 * Admin Message Modal — Layout.astro
 *
 * Tests the admin message modal that appears when the user identity API
 * (POST /api/users/register/) returns a non-empty `message` field.
 * The modal shows a message from SWF admin and can be dismissed via
 * the "Got it" button or clicking the backdrop.
 * Dismissal calls POST /api/users/message-read/ to clear the message server-side.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Admin Message Modal — Positive', () => {
  test('modal element exists in the DOM and starts hidden', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const modal = page.locator('#admin-message-modal');
    await expect(modal).toHaveCount(1);
    await expect(modal).toHaveClass(/hidden/);
  });

  test('modal contains the dismiss button with correct text', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const dismissBtn = page.locator('#admin-message-dismiss');
    await expect(dismissBtn).toHaveCount(1);
    await expect(dismissBtn).toHaveText('Got it');
  });

  test('modal contains message text and name placeholders', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const msgText = page.locator('#admin-message-text');
    const msgName = page.locator('#admin-message-name');
    await expect(msgText).toHaveCount(1);
    await expect(msgName).toHaveCount(1);
  });

  test('modal becomes visible when API returns a message', async ({ page }) => {
    // Set up route interception BEFORE navigation
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 5,
          display_name: 'Test Fox',
          message: 'Welcome to the new season!'
        })
      });
    });

    // Set localStorage before page script runs
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal).toHaveClass(/flex/);
  });

  test('modal displays the correct message text from API', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 3,
          display_name: 'Golden Owl',
          message: 'Your rank has been updated!'
        })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-text');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const msgText = page.locator('#admin-message-text');
    await expect(msgText).toHaveText('Your rank has been updated!');
  });

  test('modal displays the user display name', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 12,
          display_name: 'Silver Panda',
          message: 'Hello there!'
        })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-name');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const msgName = page.locator('#admin-message-name');
    await expect(msgName).toHaveText('Silver Panda');
  });

  test('clicking "Got it" button dismisses the modal', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 8,
          display_name: 'Blue Fox',
          message: 'Dismissal test message'
        })
      });
    });
    await page.route('**/api/users/message-read/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-dismiss');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.locator('#admin-message-dismiss').click();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('clicking backdrop dismisses the modal', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 2,
          display_name: 'Red Falcon',
          message: 'Backdrop test message'
        })
      });
    });
    await page.route('**/api/users/message-read/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-backdrop');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click on the modal backdrop (the outer div itself, not the inner content)
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveClass(/hidden/);
  });

  test('dismissing modal sends POST to /api/users/message-read/', async ({ page }) => {
    let messageReadCalled = false;

    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 1,
          display_name: 'Purple Eagle',
          message: 'API call test'
        })
      });
    });
    await page.route('**/api/users/message-read/', async (route) => {
      messageReadCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-api');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.locator('#admin-message-dismiss').click();
    await page.waitForTimeout(500);
    expect(messageReadCalled).toBe(true);
  });
});

test.describe('Admin Message Modal — Negative', () => {
  test('modal stays hidden when API returns empty message', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 4,
          display_name: 'Green Parrot',
          message: ''
        })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-empty');
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('modal stays hidden when API returns no message field', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 9,
          display_name: 'Amber Wolf'
        })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-null');
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('modal stays hidden when message is only whitespace', async ({ page }) => {
    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 6,
          display_name: 'Jade Penguin',
          message: '   '
        })
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-whitespace');
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('no duplicate admin message modals in the DOM', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const modals = page.locator('#admin-message-modal');
    await expect(modals).toHaveCount(1);
  });

  test('modal does not cause page errors when shown and dismissed', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 11,
          display_name: 'Bronze Hawk',
          message: 'Error test message'
        })
      });
    });
    await page.route('**/api/users/message-read/', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-errors');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await page.locator('#admin-message-dismiss').click();
    await page.waitForTimeout(500);

    const relevantErrors = errors.filter(e =>
      e.toLowerCase().includes('message') || e.toLowerCase().includes('modal')
    );
    expect(relevantErrors).toHaveLength(0);
  });

  test('modal gracefully handles message-read API failure', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/users/register/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_id: 7,
          display_name: 'Ivory Crane',
          message: 'Failure resilience test'
        })
      });
    });
    await page.route('**/api/users/message-read/', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"server error"}' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'pw-test-admin-msg-fail');
    });

    await page.goto(`${BASE}/`);

    const modal = page.locator('#admin-message-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Dismiss should still work visually even if the API fails
    await page.locator('#admin-message-dismiss').click();
    await expect(modal).toHaveClass(/hidden/);

    // No unhandled errors should bubble up (fetch uses .catch)
    expect(errors).toHaveLength(0);
  });
});
