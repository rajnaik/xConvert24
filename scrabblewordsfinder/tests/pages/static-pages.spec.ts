import { test, expect } from '@playwright/test';

/**
 * Static Pages Tests
 * Tests all informational pages: About, Guide, Privacy, Terms,
 * Disclaimer, and Releases for correct content and navigation.
 */

test.describe('About Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/about/');
    await expect(page).toHaveTitle(/About/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('h1')).toBeAttached();
  });

  test('mentions xConvert24', async ({ page }) => {
    await page.goto('/about/');
    const body = await page.textContent('body');
    expect(body).toContain('xConvert24');
  });

  test('has navigation links', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('a[href="/"]').first()).toBeAttached();
  });

  test('has footer links', async ({ page }) => {
    await page.goto('/about/');
    await expect(page.locator('footer')).toBeAttached();
    await expect(page.locator('footer a').first()).toBeAttached();
  });

  test('Our Promise section shows "Clean experience" messaging', async ({ page }) => {
    await page.goto('/about/');
    const body = await page.textContent('body');
    expect(body).toContain('Clean experience.');
    expect(body).toContain('No pop-ups, no sponsored results cluttering your solver');
  });

  test('tagline shows "Free, Fun, Fast & No Sign-up"', async ({ page }) => {
    await page.goto('/about/');
    const tagline = page.locator('span.text-purple-400.font-medium');
    await expect(tagline).toHaveText('Free, Fun, Fast & No Sign-up');
  });

  test('does not contain banned "No ads" claim', async ({ page }) => {
    await page.goto('/about/');
    const body = await page.textContent('body');
    expect(body).not.toMatch(/No ads\./i);
    expect(body).not.toMatch(/No banners/i);
  });

  test('lists three audiences in Built For Everyone section', async ({ page }) => {
    await page.goto('/about/');
    const body = await page.textContent('body');
    expect(body).toContain('three audiences');
    expect(body).toContain('Casual players');
    expect(body).toContain('Competitive enthusiasts');
    expect(body).toContain('Serious students of the game');
  });

  test('Memory WordBench highlight box has purple border and stars', async ({ page }) => {
    await page.goto('/about/');
    const mwbBox = page.locator('div.border-purple-600\\/60');
    await expect(mwbBox).toBeVisible();
    // Stars surrounding the heading
    const stars = mwbBox.locator('text=⭐');
    expect(await stars.count()).toBe(2);
  });

  test('Memory WordBench link exists and points to correct anchor', async ({ page }) => {
    await page.goto('/about/');
    const mwbLink = page.locator('a[href="/#wordBench"]');
    await expect(mwbLink).toBeAttached();
    await expect(mwbLink).toHaveText('Memory WordBench');
  });

  test('Memory WordBench feature bullets list key features', async ({ page }) => {
    await page.goto('/about/');
    const mwbBox = page.locator('div.border-purple-600\\/60');
    const body = await mwbBox.textContent();
    expect(body).toContain('Flashcards');
    expect(body).toContain('tap-to-flip recall');
    expect(body).toContain('Autoplay');
    expect(body).toContain('Fullscreen mode');
    expect(body).toContain('One-click save');
  });

  test('WordBench description is NOT inlined in the audience list', async ({ page }) => {
    await page.goto('/about/');
    // The MWB description was moved into its own highlight box —
    // it should not appear inside the audience <ul> bullets anymore
    const audienceList = page.locator('ul.space-y-2').first();
    const text = await audienceList.textContent();
    expect(text).not.toContain('turns your saved words into flashcards');
  });
});

test.describe('Guide Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/guide/');
    await expect(page).toHaveTitle(/Guide/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/guide/');
    await expect(page.locator('h1')).toBeAttached();
  });

  test('contains usage instructions', async ({ page }) => {
    await page.goto('/guide/');
    // Should mention tiles or letters or solver
    const body = await page.textContent('body');
    expect(body).toMatch(/tiles|letters|solver|rack/i);
  });

  test('has link back to solver', async ({ page }) => {
    await page.goto('/guide/');
    await expect(page.locator('a[href="/"]').first()).toBeAttached();
  });
});

test.describe('Privacy Page — Positive', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/privacy/');
    await expect(page).toHaveTitle(/Privacy/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/privacy/');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeAttached();
  });

  test('mentions localStorage', async ({ page }) => {
    await page.goto('/privacy/');
    const body = await page.textContent('body');
    expect(body).toMatch(/localStorage|local storage/i);
  });

  test('mentions no sign-up / no account', async ({ page }) => {
    await page.goto('/privacy/');
    const body = await page.textContent('body');
    expect(body).toMatch(/no sign-up|no account|no email/i);
  });

  test('short version mentions ads via Google AdSense', async ({ page }) => {
    await page.goto('/privacy/');
    const body = await page.textContent('body');
    expect(body).toContain('We display ads via Google AdSense');
  });

  test('short version clarifies no cross-site tracking', async ({ page }) => {
    await page.goto('/privacy/');
    const body = await page.textContent('body');
    expect(body).toContain("don't track you across other sites");
  });

  test('has dedicated Advertising — Google AdSense section', async ({ page }) => {
    await page.goto('/privacy/');
    const heading = page.locator('h2', { hasText: 'Advertising — Google AdSense' });
    await expect(heading).toBeVisible();
  });

  test('advertising section has opt-out link to Google Ads Settings', async ({ page }) => {
    await page.goto('/privacy/');
    const optOutLink = page.locator('a[href="https://www.google.com/settings/ads"]');
    await expect(optOutLink).toBeAttached();
    await expect(optOutLink).toHaveText(/Google Ads Settings/);
  });

  test('advertising section has opt-out link to aboutads.info', async ({ page }) => {
    await page.goto('/privacy/');
    const optOutLink = page.locator('a[href="https://www.aboutads.info/choices/"]');
    await expect(optOutLink).toBeAttached();
  });

  test('advertising section mentions cookie consent banner for opt-out', async ({ page }) => {
    await page.goto('/privacy/');
    const adSection = page.locator('div.border-amber-800\\/50');
    const text = await adSection.textContent();
    expect(text).toContain('cookie consent banner');
  });
});

test.describe('Privacy Page — Negative', () => {
  test('does NOT claim "We don\'t run ads"', async ({ page }) => {
    await page.goto('/privacy/');
    const body = await page.textContent('body');
    expect(body).not.toMatch(/we don't run ads/i);
    expect(body).not.toMatch(/no ads/i);
    expect(body).not.toMatch(/ad-free/i);
  });

  test('does NOT claim "We don\'t track you" without qualifier', async ({ page }) => {
    await page.goto('/privacy/');
    const body = await page.textContent('body') || '';
    // The page should say "don't track you across other sites" (qualified),
    // NOT a blanket "We don't track you." (full stop, unqualified)
    expect(body).not.toMatch(/We don't track you\./);
  });

  test('no duplicate Advertising sections', async ({ page }) => {
    await page.goto('/privacy/');
    const headings = page.locator('h2', { hasText: /Advertising/i });
    expect(await headings.count()).toBe(1);
  });

  test('opt-out links open in new tab (rel=noopener)', async ({ page }) => {
    await page.goto('/privacy/');
    const googleAdsLink = page.locator('a[href="https://www.google.com/settings/ads"]');
    await expect(googleAdsLink).toHaveAttribute('target', '_blank');
    await expect(googleAdsLink).toHaveAttribute('rel', /noopener/);
  });
});

test.describe('Terms Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page).toHaveTitle(/Terms/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/terms/');
    await expect(page.locator('h1')).toBeAttached();
  });

  test('contains terms content', async ({ page }) => {
    await page.goto('/terms/');
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(200); // Should have substantial content
  });
});

test.describe('Disclaimer Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/disclaimer/');
    await expect(page).toHaveTitle(/Disclaimer/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/disclaimer/');
    await expect(page.locator('h1')).toBeAttached();
  });

  test('mentions free/instant/no-signup nature', async ({ page }) => {
    await page.goto('/disclaimer/');
    const body = await page.textContent('body');
    expect(body).toMatch(/free|instant|no.?sign/i);
  });
});

test.describe('Releases Page', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/releases/');
    await expect(page).toHaveTitle(/Release/i);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/releases/');
    await expect(page.locator('h1')).toBeAttached();
  });

  test('contains version or changelog entries', async ({ page }) => {
    await page.goto('/releases/');
    const body = await page.textContent('body');
    expect(body).toMatch(/v\d|version|\d+\.\d+/i);
  });
});

test.describe('Blog Index', () => {
  test('blog page loads', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page).toHaveTitle(/Blog/i);
  });

  test('has navigation back to solver', async ({ page }) => {
    await page.goto('/blog/');
    await expect(page.locator('a[href="/"]').first()).toBeAttached();
  });

  test('lists blog posts with links', async ({ page }) => {
    await page.goto('/blog/');
    const links = page.locator('a[href*="/blog/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });
});
