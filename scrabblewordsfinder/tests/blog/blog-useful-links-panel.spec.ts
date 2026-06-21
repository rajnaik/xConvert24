import { test, expect } from '@playwright/test';

test.describe('Blog Index — Useful Links Panel — Positive', () => {

  test('useful links panel exists on the blog index page', async ({ page }) => {
    await page.goto('/blog/');
    const panel = page.locator('#useful-links-panel');
    await expect(panel).toBeVisible();
  });

  test('toggle button is visible with correct label', async ({ page }) => {
    await page.goto('/blog/');
    const toggle = page.locator('#useful-links-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Useful Links');
  });

  test('panel content is hidden by default', async ({ page }) => {
    await page.goto('/blog/');
    const content = page.locator('#useful-links-content');
    await expect(content).toBeHidden();
  });

  test('clicking toggle reveals the panel content', async ({ page }) => {
    await page.goto('/blog/');
    const toggle = page.locator('#useful-links-toggle');
    const content = page.locator('#useful-links-content');
    await toggle.click();
    await expect(content).toBeVisible();
  });

  test('clicking toggle again hides the panel content', async ({ page }) => {
    await page.goto('/blog/');
    const toggle = page.locator('#useful-links-toggle');
    const content = page.locator('#useful-links-content');
    await toggle.click();
    await expect(content).toBeVisible();
    await toggle.click();
    await expect(content).toBeHidden();
  });

  test('chevron rotates 180deg when panel is open', async ({ page }) => {
    await page.goto('/blog/');
    const toggle = page.locator('#useful-links-toggle');
    const chevron = page.locator('#useful-links-chevron');
    await toggle.click();
    await expect(chevron).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
  });

  test('chevron resets to 0deg when panel is closed again', async ({ page }) => {
    await page.goto('/blog/');
    const toggle = page.locator('#useful-links-toggle');
    const chevron = page.locator('#useful-links-chevron');
    await toggle.click();
    await toggle.click();
    const transform = await chevron.evaluate(el => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('panel contains 4 category sections', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const content = page.locator('#useful-links-content');
    const sections = content.locator('.rounded-lg.border');
    await expect(sections).toHaveCount(4);
  });

  test('Games & Activities section has expected links', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const content = page.locator('#useful-links-content');
    const gamesSection = content.locator('.border-purple-500\\/20');
    await expect(gamesSection.locator('a')).toHaveCount(4);
    await expect(gamesSection).toContainText('Activities Hub');
    await expect(gamesSection).toContainText('60-Second Challenge');
  });

  test('Player Tools & Data section has expected links', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const content = page.locator('#useful-links-content');
    const toolsSection = content.locator('.border-blue-500\\/20');
    await expect(toolsSection.locator('a')).toHaveCount(4);
    await expect(toolsSection).toContainText('Player Statistics');
    await expect(toolsSection).toContainText('Settings');
  });

  test('Site Information section has expected links', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const content = page.locator('#useful-links-content');
    const infoSection = content.locator('.border-amber-500\\/20');
    await expect(infoSection.locator('a')).toHaveCount(5);
    await expect(infoSection).toContainText('About Us');
    await expect(infoSection).toContainText('User Guide');
    await expect(infoSection).toContainText('Suggest a Feature');
  });

  test('Legal & Privacy section has expected links', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const content = page.locator('#useful-links-content');
    const legalSection = content.locator('.border-gray-600\\/30');
    await expect(legalSection.locator('a')).toHaveCount(4);
    await expect(legalSection).toContainText('Privacy Policy');
    await expect(legalSection).toContainText('Terms of Use');
    await expect(legalSection).toContainText('Contact Us');
  });

  test('full page link at bottom points to /blog/useful-links/', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const fullPageLink = page.locator('#useful-links-content a:has-text("View full Useful Links page")');
    await expect(fullPageLink).toBeVisible();
    await expect(fullPageLink).toHaveAttribute('href', '/blog/useful-links/');
  });
});

test.describe('Blog Index — Useful Links Panel — Negative', () => {

  test('no duplicate useful links panels on the page', async ({ page }) => {
    await page.goto('/blog/');
    const panels = page.locator('#useful-links-panel');
    await expect(panels).toHaveCount(1);
  });

  test('no console errors when toggling the panel', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    await page.locator('#useful-links-toggle').click();
    await page.waitForTimeout(500);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'))).toHaveLength(0);
  });

  test('panel links all have non-empty href attributes', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const links = await page.locator('#useful-links-content a').all();
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href, 'Panel link should have a non-empty href').toBeTruthy();
      expect(href!.trim().length).toBeGreaterThan(0);
    }
  });

  test('panel links all start with / (internal links only)', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const links = await page.locator('#useful-links-content a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.startsWith('/'), `Link href "${href}" should be an internal path`).toBe(true);
    }
  });

  test('panel does not contain duplicate links', async ({ page }) => {
    await page.goto('/blog/');
    await page.locator('#useful-links-toggle').click();
    const links = await page.locator('#useful-links-content a').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate panel links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('panel has amber border styling (not purple)', async ({ page }) => {
    await page.goto('/blog/');
    const panel = page.locator('#useful-links-panel');
    const classes = await panel.getAttribute('class');
    expect(classes).toContain('border-amber-500/30');
    expect(classes).not.toContain('border-purple-500');
  });

  test('old Useful Links nav bar link no longer exists', async ({ page }) => {
    await page.goto('/blog/');
    const navBar = page.locator('.flex.flex-wrap.gap-2.mb-6');
    const oldLink = navBar.locator('a:has-text("Useful Links")');
    await expect(oldLink).toHaveCount(0);
  });
});
