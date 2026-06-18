import { test, expect } from '@playwright/test';

/**
 * Admin Banner Management — Playwright Tests
 * 
 * CUSTOMIZE:
 * - URL paths if admin route differs
 * - API endpoint URLs if different from /api/banners
 * - Number of banner cards
 */

test.describe('Admin Banner Management — Page Structure', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/banner-management');
    await expect(page).toHaveTitle(/Banner Management/);
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto('/admin/banner-management');
    await expect(page.locator('h1')).toContainText('Banner Management');
    await expect(page.locator('text=Toggle banners active or inactive')).toBeAttached();
  });

  test('displays all 10 banner options', async ({ page }) => {
    await page.goto('/admin/banner-management');
    const options = page.locator('.banner-option');
    await expect(options).toHaveCount(10);
  });

  test('banner management link is highlighted as active', async ({ page }) => {
    await page.goto('/admin/banner-management');
    const bannerLink = page.locator('nav a[href="/admin/banner-management"]');
    await expect(bannerLink).toHaveClass(/font-medium/);
  });
});

test.describe('Admin Banner Management — Rotation Pool Summary', () => {
  test('rotation summary section is visible', async ({ page }) => {
    await page.goto('/admin/banner-management');
    await expect(page.locator('#rotation-summary')).toBeVisible();
  });

  test('displays count and info after banners load', async ({ page }) => {
    await page.route('**/api/banners', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          banners: [
            { option_number: 1, name: 'Banner 1', description: '', status: 'active' },
            { option_number: 2, name: 'Banner 2', description: '', status: 'active' },
            { option_number: 3, name: 'Banner 3', description: '', status: 'inactive' },
          ],
        }),
      })
    );
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() =>
      document.getElementById('active-count')?.textContent !== '—'
    );

    await expect(page.locator('#active-count')).toHaveText('2');
    await expect(page.locator('#rotation-info')).toContainText('2 of 10');
  });

  test('shows warning when no banners are active', async ({ page }) => {
    await page.route('**/api/banners', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          banners: [{ option_number: 1, name: 'Banner 1', description: '', status: 'inactive' }],
        }),
      })
    );
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() =>
      document.getElementById('active-count')?.textContent !== '—'
    );

    await expect(page.locator('#active-count')).toHaveText('0');
    await expect(page.locator('#rotation-info')).toContainText('No banners active');
  });
});

test.describe('Admin Banner Management — Toggle Behaviour', () => {
  test('active banners have checked toggles after load', async ({ page }) => {
    await page.route('**/api/banners', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          banners: [
            { option_number: 1, name: 'Banner 1', description: '', status: 'active' },
            { option_number: 2, name: 'Banner 2', description: '', status: 'inactive' },
          ],
        }),
      })
    );
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() =>
      document.getElementById('active-count')?.textContent !== '—'
    );

    await expect(page.locator('.banner-toggle[data-option="1"] input')).toBeChecked();
    await expect(page.locator('.banner-toggle[data-option="2"] input')).not.toBeChecked();
  });

  test('active banner cards have green border styling', async ({ page }) => {
    await page.route('**/api/banners', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          banners: [
            { option_number: 1, name: 'Banner 1', description: '', status: 'active' },
            { option_number: 2, name: 'Banner 2', description: '', status: 'inactive' },
          ],
        }),
      })
    );
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() =>
      document.getElementById('active-count')?.textContent !== '—'
    );

    await expect(page.locator('.banner-option[data-option="1"]')).toHaveClass(/border-green-600/);
    await expect(page.locator('.banner-option[data-option="2"]')).toHaveClass(/border-gray-700/);
  });

  test('clicking toggle sends PUT request to /api/banners', async ({ page }) => {
    await page.route('**/api/banners', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ banners: [{ option_number: 1, name: 'Banner 1', description: '', status: 'inactive' }] }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active_count: 1 }) });
    });
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() => document.getElementById('active-count')?.textContent !== '—');

    const responsePromise = page.waitForResponse(r => r.url().includes('/api/banners') && r.request().method() === 'PUT');
    await page.locator('.banner-toggle[data-option="1"] input').click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const body = JSON.parse(response.request().postData() || '{}');
    expect(body.option_number).toBe(1);
    expect(body.status).toBe('active');
  });
});

test.describe('Admin Banner Management — Toast & Errors', () => {
  test('toast appears after successful toggle', async ({ page }) => {
    await page.route('**/api/banners', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ banners: [{ option_number: 1, name: 'Banner 1', description: '', status: 'inactive' }] }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ active_count: 1 }) });
    });
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() => document.getElementById('active-count')?.textContent !== '—');

    await page.locator('.banner-toggle[data-option="1"] input').click();
    await expect(page.locator('#toast')).not.toHaveClass(/hidden/);
    await expect(page.locator('#toast-text')).toContainText('Banner 1');
  });

  test('shows error and reverts toggle on PUT failure', async ({ page }) => {
    await page.route('**/api/banners', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ banners: [{ option_number: 1, name: 'Banner 1', description: '', status: 'inactive' }] }),
        });
      }
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'DB error' }) });
    });
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() => document.getElementById('active-count')?.textContent !== '—');

    await page.locator('.banner-toggle[data-option="1"] input').click();
    await expect(page.locator('#error-banner')).not.toHaveClass(/hidden/);
    await expect(page.locator('#error-text')).toContainText('DB error');
    await expect(page.locator('.banner-toggle[data-option="1"] input')).not.toBeChecked();
  });

  test('shows failure message when GET /api/banners fails', async ({ page }) => {
    await page.route('**/api/banners', route => route.fulfill({ status: 500, body: 'Error' }));
    await page.goto('/admin/banner-management');
    await page.waitForFunction(() =>
      document.getElementById('rotation-info')?.textContent !== 'Loading...'
    , { timeout: 10000 });

    await expect(page.locator('#rotation-info')).toContainText('Failed to load');
  });
});

test.describe('Admin Banner Management — API Integration', () => {
  test('page fetches GET /api/banners on load', async ({ page }) => {
    const responsePromise = page.waitForResponse(r => r.url().includes('/api/banners') && r.request().method() === 'GET');
    await page.goto('/admin/banner-management');
    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });
});

test.describe('Admin Banner Management — Accessibility', () => {
  test('all banner images have alt attributes', async ({ page }) => {
    await page.goto('/admin/banner-management');
    const images = page.locator('.banner-option img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('toggle checkboxes are screen-reader accessible', async ({ page }) => {
    await page.goto('/admin/banner-management');
    const checkboxes = page.locator('.banner-toggle input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toHaveClass(/sr-only/);
    }
  });
});
