import { test, expect } from '@playwright/test';

/**
 * Admin Logo Management Page — UI Tests
 * Tests the /admin/logo-management page:
 * navigation, logo option cards, Set buttons,
 * API-backed persistence, and confirmation feedback.
 */

test.describe('Admin Logo Management — Page Structure', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await expect(page).toHaveTitle(/Logo Management/);
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await expect(page.locator('h1')).toContainText('Logo Management');
    await expect(page.locator('text=Select the active logo for ScrabbleWordsFinder.com')).toBeAttached();
  });

  test('has navigation bar with correct links', async ({ page }) => {
    await page.goto('/admin/logo-management');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/report"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/ops"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/logo-management"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]')).toBeAttached();
  });

  test('logo management link is highlighted as active', async ({ page }) => {
    await page.goto('/admin/logo-management');
    const logoLink = page.locator('nav a[href="/admin/logo-management"]');
    await expect(logoLink).toHaveClass(/text-blue-400/);
    await expect(logoLink).toHaveClass(/font-medium/);
  });

  test('displays all 5 logo options', async ({ page }) => {
    await page.goto('/admin/logo-management');
    const options = page.locator('.logo-option');
    await expect(options).toHaveCount(5);
  });

  test('each option has an image, title, and Set button', async ({ page }) => {
    await page.goto('/admin/logo-management');
    for (let i = 1; i <= 5; i++) {
      const option = page.locator(`[data-option="${i}"]`);
      await expect(option.locator('img')).toBeAttached();
      await expect(option.locator('h3')).toContainText(`Option ${i}`);
      await expect(option.locator('.set-logo-btn')).toBeAttached();
    }
  });

  test('logo images point to correct paths', async ({ page }) => {
    await page.goto('/admin/logo-management');
    for (let i = 1; i <= 5; i++) {
      const img = page.locator(`[data-option="${i}"] img`);
      await expect(img).toHaveAttribute('src', `/logo-options/option-${i}.svg`);
    }
  });

  test('current active logo banner is visible', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await expect(page.locator('#current-logo-banner')).toBeVisible();
    await expect(page.locator('#current-logo-img')).toBeVisible();
    await expect(page.locator('#current-logo-label')).toBeVisible();
  });
});

test.describe('Admin Logo Management — Set Button Behavior', () => {
  test('active logo option has disabled button with checkmark', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const disabledBtn = page.locator('.set-logo-btn[disabled]');
    await expect(disabledBtn).toHaveCount(1);
    await expect(disabledBtn).toContainText('✓ Active');
  });

  test('non-active options have enabled Set buttons', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const enabledBtns = page.locator('.set-logo-btn:not([disabled])');
    await expect(enabledBtns).toHaveCount(4);
  });

  test('clicking Set button sends PUT request to API', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const enabledBtn = page.locator('.set-logo-btn:not([disabled])').first();
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/site-status') && resp.request().method() === 'PUT'
    );
    await enabledBtn.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('clicking Set shows confirmation message', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const confirmation = page.locator('#confirmation');
    await expect(confirmation).toHaveClass(/hidden/);

    const enabledBtn = page.locator('.set-logo-btn:not([disabled])').first();
    await enabledBtn.click();

    await expect(confirmation).not.toHaveClass(/hidden/);
    await expect(confirmation).toContainText('Logo updated');
  });

  test('confirmation includes option description', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const enabledBtn = page.locator('.set-logo-btn:not([disabled])').first();
    await enabledBtn.click();

    const confirmText = page.locator('#confirmation-text');
    await expect(confirmText).toContainText('active website logo');
  });

  test('confirmation message auto-hides after 4 seconds', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const enabledBtn = page.locator('.set-logo-btn:not([disabled])').first();
    await enabledBtn.click();

    const confirmation = page.locator('#confirmation');
    await expect(confirmation).not.toHaveClass(/hidden/);

    await page.waitForTimeout(4500);
    await expect(confirmation).toHaveClass(/hidden/);
  });

  test('after setting a logo, it becomes active and button is disabled', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const btn = page.locator('.set-logo-btn:not([disabled])').first();
    const option = await btn.getAttribute('data-option');
    await btn.click();

    await page.waitForTimeout(500);

    const updatedBtn = page.locator(`.set-logo-btn[data-option="${option}"]`);
    await expect(updatedBtn).toBeDisabled();
    await expect(updatedBtn).toContainText('✓ Active');
  });

  test('active option card has blue border highlight', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const activeCard = page.locator('.logo-option.border-blue-500');
    await expect(activeCard).toHaveCount(1);
    await expect(activeCard).toHaveClass(/ring-2/);
  });
});

test.describe('Admin Logo Management — API Integration', () => {
  test('page loads current logo from GET /api/site-status', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/site-status') && resp.request().method() === 'GET'
    );
    await page.goto('/admin/logo-management');
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.logo_option).toBeGreaterThanOrEqual(1);
    expect(data.logo_option).toBeLessThanOrEqual(5);
  });

  test('banner updates to show current logo after load', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const label = document.getElementById('current-logo-label');
      return label && label.textContent && label.textContent.includes('Option');
    }, { timeout: 10000 });

    const label = page.locator('#current-logo-label');
    const text = await label.textContent();
    expect(text).toContain('Option');
  });

  test('banner shows last updated info', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const el = document.getElementById('current-logo-updated');
      return el && el.textContent !== 'Loading...';
    }, { timeout: 10000 });

    const updated = page.locator('#current-logo-updated');
    const text = await updated.textContent();
    expect(text).not.toBe('Loading...');
  });
});

test.describe('Admin Logo Management — Accessibility', () => {
  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/admin/logo-management');
    const images = page.locator('.logo-option img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('Set buttons are focusable and keyboard-activatable', async ({ page }) => {
    await page.goto('/admin/logo-management');
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('.set-logo-btn[disabled]');
      return btns.length === 1;
    }, { timeout: 10000 });

    const btn = page.locator('.set-logo-btn:not([disabled])').first();
    await btn.focus();
    const isFocused = await btn.evaluate(el => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  });
});

test.describe('Admin Dashboard — Site Status Widget', () => {
  test('site status widget is visible on admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('#site-status-widget')).toBeVisible();
  });

  test('widget shows status, logo, and updated info sections', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('#widget-status')).toBeVisible();
    await expect(page.locator('#widget-logo-img')).toBeVisible();
    await expect(page.locator('#widget-logo-label')).toBeVisible();
    await expect(page.locator('#widget-updated')).toBeVisible();
  });

  test('widget loads data from /api/site-status', async ({ page }) => {
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/site-status') && resp.request().method() === 'GET'
    );
    await page.goto('/admin');
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });

  test('status indicator dot changes color after load', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForFunction(() => {
      const el = document.getElementById('status-indicator');
      return el && !el.classList.contains('animate-pulse');
    }, { timeout: 10000 });

    const indicator = page.locator('#status-indicator');
    await expect(indicator).not.toHaveClass(/animate-pulse/);
  });

  test('widget shows logo option number', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForFunction(() => {
      const el = document.getElementById('widget-logo-label');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    const label = page.locator('#widget-logo-label');
    const text = await label.textContent();
    expect(text).toMatch(/Option \d/);
  });
});
