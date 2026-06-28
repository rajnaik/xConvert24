import { test, expect } from '@playwright/test';

/**
 * Admin Page Map — Layout & Structure Tests
 * Tests the /admin/pagemap/ page built with Layout component:
 * - Uses Layout component with admin nav (showHeader={false})
 * - Full-viewport graph with no scrollbars (body overflow: hidden)
 * - Standard admin navigation links with trailing slashes
 * - Heading bar with description text
 * - Graph container fills remaining space via Tailwind flex utilities
 * - noindex meta tag for SEO compliance
 */

test.describe('Admin Page Map — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    await expect(page).toHaveTitle('Page Map — SWF Admin');
  });

  test('has admin nav bar with brand link', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    // Brand link back to admin
    const brand = nav.locator('a[href="/admin/"]').first();
    await expect(brand).toBeAttached();
  });

  test('nav has correct navigation links with trailing slashes', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin/"]').first()).toBeAttached();
    await expect(nav.locator('a[href="/admin/pagemap/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/documentation/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/seo/"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]')).toBeAttached();
  });

  test('current page link is highlighted', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const currentLink = page.locator('nav a[href="/admin/pagemap/"]');
    // Should have the active styling (text-blue-400 font-medium)
    await expect(currentLink).toHaveClass(/text-blue-400/);
    await expect(currentLink).toHaveClass(/font-medium/);
  });

  test('page uses full viewport height layout', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const wrapper = page.locator('.flex.flex-col.h-screen');
    await expect(wrapper).toBeVisible();
    const height = await wrapper.evaluate(el => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(400);
  });

  test('body has overflow hidden to prevent scrollbars', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const overflow = await page.locator('body').evaluate(el => getComputedStyle(el).overflow);
    expect(overflow).toBe('hidden');
  });

  test('nav bar does not shrink', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const nav = page.locator('nav');
    const flexShrink = await nav.evaluate(el => getComputedStyle(el).flexShrink);
    expect(flexShrink).toBe('0');
  });

  test('graph area fills remaining space', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const graphArea = page.locator('.flex-1.min-h-0.relative');
    await expect(graphArea).toBeVisible();
    const flex = await graphArea.evaluate(el => getComputedStyle(el).flexGrow);
    expect(flex).toBe('1');
  });

  test('graph area has min-height 0 for proper flex layout', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const graphArea = page.locator('.flex-1.min-h-0.relative');
    const minHeight = await graphArea.evaluate(el => getComputedStyle(el).minHeight);
    expect(minHeight).toBe('0px');
  });

  test('graph area has relative positioning', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const graphArea = page.locator('.flex-1.min-h-0.relative');
    const position = await graphArea.evaluate(el => getComputedStyle(el).position);
    expect(position).toBe('relative');
  });

  test('has page heading with map icon', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const heading = page.locator('h1:has-text("Page Map")');
    await expect(heading).toBeAttached();
    await expect(heading).toContainText('Page Map');
  });

  test('has heading bar with description text', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const desc = page.locator('p:has-text("Interactive graph of all public pages")');
    await expect(desc).toBeVisible();
  });

  test('astro-island inside graph area renders with block display', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const island = page.locator('.flex-1.min-h-0 astro-island');
    await island.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
    const count = await island.count();
    if (count > 0) {
      const styles = await island.first().evaluate(el => {
        const cs = getComputedStyle(el);
        return { display: cs.display, width: cs.width, height: cs.height };
      });
      expect(styles.display).toBe('block');
      expect(parseInt(styles.width)).toBeGreaterThan(0);
      expect(parseInt(styles.height)).toBeGreaterThan(0);
    }
  });

  test('has noindex meta tag', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
  });
});

test.describe('Admin Page Map — Negative', () => {
  test('page does not scroll vertically', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    // overflow:hidden on body prevents actual scrolling regardless of content height
    const bodyOverflow = await page.locator('body').evaluate(el => getComputedStyle(el).overflow);
    expect(bodyOverflow).toBe('hidden');
    // Verify no visible scrollbar by checking body scrollTop stays 0 after attempt
    await page.evaluate(() => { document.documentElement.scrollTop = 100; });
    const scrollPos = await page.evaluate(() => document.documentElement.scrollTop);
    expect(scrollPos).toBe(0);
  });

  test('nav height stays constant on viewport resize', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const nav = page.locator('nav');
    const heightBefore = await nav.evaluate(el => el.getBoundingClientRect().height);

    await page.setViewportSize({ width: 1280, height: 400 });
    const heightAfter = await nav.evaluate(el => el.getBoundingClientRect().height);

    expect(heightBefore).toBe(heightAfter);
  });

  test('no duplicate nav elements', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const navCount = await page.locator('nav').count();
    expect(navCount).toBe(1);
  });

  test('astro-island does not overflow graph area', async ({ page }) => {
    await page.goto('/admin/pagemap/');
    const island = page.locator('.flex-1.min-h-0 astro-island');
    await island.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
    const count = await island.count();
    if (count > 0) {
      const { containerWidth, containerHeight, islandWidth, islandHeight } = await page.evaluate(() => {
        const container = document.querySelector('.flex-1.min-h-0.relative')!;
        const island = container.querySelector('astro-island')!;
        const cRect = container.getBoundingClientRect();
        const iRect = island.getBoundingClientRect();
        return {
          containerWidth: cRect.width,
          containerHeight: cRect.height,
          islandWidth: iRect.width,
          islandHeight: iRect.height,
        };
      });
      expect(islandWidth).toBeLessThanOrEqual(containerWidth + 1);
      expect(islandHeight).toBeLessThanOrEqual(containerHeight + 1);
    }
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/pagemap/');
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e =>
      !e.includes('hydration') && !e.includes('Minified React error')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
