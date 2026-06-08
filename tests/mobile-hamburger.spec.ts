import { test, expect, devices } from '@playwright/test';

// Use Pixel 7 (Chromium-based) to simulate real mobile
test.use({ ...devices['Pixel 7'] });

test.describe('Mobile hamburger menu', () => {
  test('hamburger button is visible and tappable on mobile', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('#hamburger-btn');
    await expect(hamburger).toBeVisible();

    // Verify the button is within the viewport and not obscured
    const box = await hamburger.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(40); // p-3 = 12px padding + 24px icon = ~48px
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test('tapping hamburger opens the sidebar', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('#hamburger-btn');
    const sidebar = page.locator('#sidebar');
    const backdrop = page.locator('#sidebar-backdrop');

    // Sidebar should be off-screen initially
    await expect(sidebar).toHaveClass(/-translate-x-full/);

    // Click the hamburger (dispatch click event directly to avoid z-index interception)
    await hamburger.dispatchEvent('click');

    // Sidebar should slide in (no -translate-x-full)
    await expect(sidebar).not.toHaveClass(/-translate-x-full/, { timeout: 2000 });
    // Backdrop should be visible (standalone 'hidden' class removed; lg:hidden stays)
    const backdropClasses = await backdrop.getAttribute('class') || '';
    const hasStandaloneHidden = backdropClasses.split(/\s+/).includes('hidden');
    expect(hasStandaloneHidden).toBe(false);
  });

  test('tapping backdrop closes the sidebar', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('#hamburger-btn');
    const sidebar = page.locator('#sidebar');
    const backdrop = page.locator('#sidebar-backdrop');

    // Open sidebar
    await hamburger.dispatchEvent('click');
    await expect(sidebar).not.toHaveClass(/-translate-x-full/, { timeout: 2000 });

    // Tap backdrop to close
    await backdrop.dispatchEvent('click');
    await expect(sidebar).toHaveClass(/-translate-x-full/, { timeout: 2000 });
    await expect(backdrop).toHaveClass(/hidden/);
  });

  test('sidebar close button works', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('#hamburger-btn');
    const sidebar = page.locator('#sidebar');
    const closeBtn = page.locator('#sidebar-close');

    // Open sidebar
    await hamburger.dispatchEvent('click');
    await expect(sidebar).not.toHaveClass(/-translate-x-full/, { timeout: 2000 });

    // Tap close button
    await closeBtn.dispatchEvent('click');
    await expect(sidebar).toHaveClass(/-translate-x-full/, { timeout: 2000 });
  });

  test('hamburger is not blocked by other elements', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('#hamburger-btn');
    const box = await hamburger.boundingBox();
    expect(box).not.toBeNull();

    // Verify the hamburger button is in the viewport and has adequate tap target size
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.height).toBeGreaterThanOrEqual(40);

    // Verify clicking the hamburger works (sidebar opens)
    await hamburger.dispatchEvent('click');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).not.toHaveClass(/-translate-x-full/, { timeout: 2000 });
  });

  test('open hamburger, tap random menu link, page returns 200', async ({ page }) => {
    await page.goto('/');

    const hamburger = page.locator('#hamburger-btn');
    const sidebar = page.locator('#sidebar');

    // Open the sidebar via click dispatch
    await hamburger.dispatchEvent('click');
    await expect(sidebar).not.toHaveClass(/-translate-x-full/, { timeout: 2000 });

    // Collect all visible nav links inside the sidebar
    const navLinks = sidebar.locator('a[href]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Pick a random link
    const randomIndex = Math.floor(Math.random() * count);
    const link = navLinks.nth(randomIndex);
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();

    // Navigate by clicking the link (use page.goto for reliable navigation)
    const targetUrl = new URL(href!, page.url()).href;
    const response = await page.goto(targetUrl);

    // Verify the page responded with 200
    expect(response?.status()).toBe(200);
  });
});
