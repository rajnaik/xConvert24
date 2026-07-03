import { test, expect } from '@playwright/test';

/**
 * Tech Stack Page Tests
 * Covers the /tech-stack page structure, sections, and tool cards.
 */

test.describe('Tech Stack Page — Positive', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/tech-stack/');
    await expect(page).toHaveTitle(/Tech Stack/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/tech-stack/');
    await expect(page.locator('h1').first()).toHaveText('Tech Stack');
  });

  test('has back to solver link', async ({ page }) => {
    await page.goto('/tech-stack/');
    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible();
  });

  test('displays version number', async ({ page }) => {
    await page.goto('/tech-stack/');
    const version = page.locator('span.text-purple-400');
    await expect(version).toBeVisible();
    const text = await version.textContent();
    expect(text).toMatch(/^v\d+\.\d+/);
  });

  test('has Development & AI section with Kiro card', async ({ page }) => {
    await page.goto('/tech-stack/');
    const kiroLink = page.locator('a[href="https://kiro.dev/"]');
    await expect(kiroLink).toBeVisible();
    await expect(kiroLink.locator('p.text-sm.font-semibold')).toHaveText('Kiro');
  });

  test('has Hosting & Infrastructure section with Cloudflare card', async ({ page }) => {
    await page.goto('/tech-stack/');
    const cfLink = page.locator('a[href="https://cloudflare.com/"]');
    await expect(cfLink).toBeVisible();
    await expect(cfLink.locator('p.text-sm.font-semibold')).toContainText('Cloudflare');
  });

  test('has Frameworks & Runtime section with Astro card showing version', async ({ page }) => {
    await page.goto('/tech-stack/');
    const astroLink = page.locator('a[href="https://astro.build/"]');
    await expect(astroLink).toBeVisible();
    await expect(astroLink.locator('p.text-sm.font-semibold')).toHaveText('Astro 6.4.4');
  });

  test('has Tailwind CSS card with version number', async ({ page }) => {
    await page.goto('/tech-stack/');
    const tailwindLink = page.locator('a[href="https://tailwindcss.com/"]');
    await expect(tailwindLink).toBeVisible();
    await expect(tailwindLink.locator('p.text-sm.font-semibold')).toHaveText('Tailwind CSS 4.3.0');
  });

  test('has TypeScript card with version number', async ({ page }) => {
    await page.goto('/tech-stack/');
    const tsLink = page.locator('a[href="https://www.typescriptlang.org/"]');
    await expect(tsLink).toBeVisible();
    await expect(tsLink.locator('p.text-sm.font-semibold')).toHaveText('TypeScript 6.0.3');
  });

  test('has @astrojs/react card linking to react.dev', async ({ page }) => {
    await page.goto('/tech-stack/');
    const reactLink = page.locator('a[href="https://react.dev/"]');
    await expect(reactLink).toBeVisible();
    await expect(reactLink.locator('p.text-sm.font-semibold')).toHaveText('@astrojs/react 6.0.0');
    await expect(reactLink.locator('img')).toHaveAttribute('alt', 'React');
  });

  test('has Testing & Quality section with Playwright card', async ({ page }) => {
    await page.goto('/tech-stack/');
    const pwLink = page.locator('a[href="https://playwright.dev/"]');
    await expect(pwLink).toBeVisible();
    await expect(pwLink.locator('p.text-sm.font-semibold')).toContainText('Playwright');
  });

  test('has Mobile Simulator Pro card in Testing & Quality', async ({ page }) => {
    await page.goto('/tech-stack/');
    const mobileSimLink = page.locator('a[href*="peipdddkaeomnfdenmkddkapeemjomnb"]');
    await expect(mobileSimLink).toBeVisible();
    await expect(mobileSimLink.locator('text=Mobile Simulator Pro')).toBeVisible();
    await expect(mobileSimLink.locator('text=Chrome Extension')).toBeVisible();
  });

  test('Mobile Simulator Pro card has correct attributes', async ({ page }) => {
    await page.goto('/tech-stack/');
    const mobileSimLink = page.locator('a[href*="peipdddkaeomnfdenmkddkapeemjomnb"]');
    await expect(mobileSimLink).toHaveAttribute('target', '_blank');
    await expect(mobileSimLink).toHaveAttribute('rel', 'noopener');
  });

  test('Mobile Simulator Pro card has image with alt text', async ({ page }) => {
    await page.goto('/tech-stack/');
    const mobileSimLink = page.locator('a[href*="peipdddkaeomnfdenmkddkapeemjomnb"]');
    const img = mobileSimLink.locator('img');
    await expect(img).toHaveAttribute('alt', 'Mobile Simulator Pro');
    await expect(img).toHaveAttribute('loading', 'lazy');
  });

  test('has Client-Side Libraries section heading', async ({ page }) => {
    await page.goto('/tech-stack/');
    const heading = page.locator('h2:has-text("Client-Side Libraries")');
    await expect(heading).toBeVisible();
  });

  test('has jsPDF card with version and description', async ({ page }) => {
    await page.goto('/tech-stack/');
    const jspdfLink = page.locator('a[href="https://github.com/parallax/jsPDF"]');
    await expect(jspdfLink).toBeVisible();
    await expect(jspdfLink.locator('p.text-sm.font-semibold')).toHaveText('jsPDF 2.5.2');
    await expect(jspdfLink.locator('text=Client-side PDF generation')).toBeVisible();
  });

  test('has animal-avatar-generator card with version and description', async ({ page }) => {
    await page.goto('/tech-stack/');
    const avatarLink = page.locator('a[href="https://github.com/roma-lukashik/animal-avatar-generator"]');
    await expect(avatarLink).toBeVisible();
    await expect(avatarLink.locator('p.text-sm.font-semibold')).toHaveText('animal-avatar-generator 1.2.0');
    await expect(avatarLink.locator('text=SVG avatar generation')).toBeVisible();
  });

  test('has Data & Dictionaries section', async ({ page }) => {
    await page.goto('/tech-stack/');
    const body = await page.textContent('body');
    expect(body).toContain('SOWPODS');
    expect(body).toContain('TWL');
  });

  test('has GitHub card with inline SVG icon', async ({ page }) => {
    await page.goto('/tech-stack/');
    const githubLink = page.locator('a[href="https://github.com/"]');
    await expect(githubLink).toBeVisible();
    await expect(githubLink.locator('p.text-sm.font-semibold')).toHaveText('GitHub');
    const svg = githubLink.locator('svg');
    await expect(svg).toBeVisible();
    await expect(svg).toHaveClass(/w-10/);
    await expect(svg).toHaveClass(/h-10/);
    await expect(svg).toHaveClass(/text-white/);
  });

  test('has CTA button to word finder', async ({ page }) => {
    await page.goto('/tech-stack/');
    const cta = page.locator('a:has-text("Try the Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('has FAQPage structured data', async ({ page }) => {
    await page.goto('/tech-stack/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundFAQ = false;
    for (let i = 0; i < count; i++) {
      const json = await schemas.nth(i).textContent();
      if (json && json.includes('"FAQPage"')) {
        foundFAQ = true;
        expect(json).toContain('What technology does ScrabbleWordsFinder use');
        break;
      }
    }
    expect(foundFAQ).toBe(true);
  });
});

test.describe('Tech Stack Page — Negative', () => {
  test('no duplicate Mobile Simulator Pro cards', async ({ page }) => {
    await page.goto('/tech-stack/');
    const cards = page.locator('a[href*="peipdddkaeomnfdenmkddkapeemjomnb"]');
    expect(await cards.count()).toBe(1);
  });

  test('no duplicate React cards', async ({ page }) => {
    await page.goto('/tech-stack/');
    const reactCards = page.locator('a[href="https://react.dev/"]');
    expect(await reactCards.count()).toBe(1);
  });

  test('no duplicate jsPDF cards', async ({ page }) => {
    await page.goto('/tech-stack/');
    const cards = page.locator('a[href="https://github.com/parallax/jsPDF"]');
    expect(await cards.count()).toBe(1);
  });

  test('no duplicate animal-avatar-generator cards', async ({ page }) => {
    await page.goto('/tech-stack/');
    const cards = page.locator('a[href="https://github.com/roma-lukashik/animal-avatar-generator"]');
    expect(await cards.count()).toBe(1);
  });

  test('no broken images (all tech cards have images or icons)', async ({ page }) => {
    await page.goto('/tech-stack/');
    const images = page.locator('img[loading="lazy"]');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    // Check none have empty src
    for (let i = 0; i < count; i++) {
      const src = await images.nth(i).getAttribute('src');
      expect(src).toBeTruthy();
      expect(src!.length).toBeGreaterThan(0);
    }
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/tech-stack/');
    expect(errors).toHaveLength(0);
  });

  test('all external links open in new tab', async ({ page }) => {
    await page.goto('/tech-stack/');
    const externalLinks = page.locator('a[href^="http"]');
    const count = await externalLinks.count();
    for (let i = 0; i < count; i++) {
      const target = await externalLinks.nth(i).getAttribute('target');
      expect(target).toBe('_blank');
    }
  });
});
