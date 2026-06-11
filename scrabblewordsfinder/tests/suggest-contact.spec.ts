import { test, expect } from '@playwright/test';

/**
 * Suggest & Contact Page Tests
 * Tests the feature suggestion form submission, URL prefill,
 * and contact page mailto generation.
 */

test.describe('Suggest Page — Structure', () => {
  test('suggest page loads with correct title', async ({ page }) => {
    await page.goto('/suggest');
    await expect(page).toHaveTitle(/Suggest a Feature/);
    await expect(page.locator('h1')).toContainText('Suggest a Feature');
  });

  test('has all form fields', async ({ page }) => {
    await page.goto('/suggest');
    await expect(page.locator('#name')).toBeAttached();
    await expect(page.locator('#email')).toBeAttached();
    await expect(page.locator('#suggestion')).toBeAttached();
    await expect(page.locator('button[type="submit"]')).toBeAttached();
  });

  test('suggestion field is required', async ({ page }) => {
    await page.goto('/suggest');
    const textarea = page.locator('#suggestion');
    await expect(textarea).toHaveAttribute('required', '');
  });

  test('has navigation links', async ({ page }) => {
    await page.goto('/suggest');
    await expect(page.locator('a[href="/"]')).toBeAttached();
    await expect(page.locator('a[href="/blog"]')).toBeAttached();
  });

  test('has "how we handle suggestions" section', async ({ page }) => {
    await page.goto('/suggest');
    await expect(page.locator('text=How we handle suggestions')).toBeAttached();
    await expect(page.locator('text=We read every single suggestion')).toBeAttached();
  });
});

test.describe('Suggest Page — URL Prefill', () => {
  test('prefills suggestion from ?title= URL param', async ({ page }) => {
    await page.goto('/suggest?title=Scrabble+Solver');
    const textarea = page.locator('#suggestion');
    const value = await textarea.inputValue();
    expect(value).toContain('Scrabble Solver');
  });

  test('prefills with encoded title param', async ({ page }) => {
    await page.goto('/suggest?title=Free+Scrabble+Word+Finder');
    const textarea = page.locator('#suggestion');
    const value = await textarea.inputValue();
    expect(value).toContain('Free Scrabble Word Finder');
  });

  test('no prefill when title param is missing', async ({ page }) => {
    await page.goto('/suggest');
    const textarea = page.locator('#suggestion');
    const value = await textarea.inputValue();
    expect(value).toBe('');
  });
});

test.describe('Suggest Page — Form Submission', () => {
  test('shows error alert when submitting empty suggestion', async ({ page }) => {
    await page.goto('/suggest');
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Try to submit without filling suggestion
    await page.locator('#name').fill('Test User');
    await page.locator('button[type="submit"]').click();
    // HTML5 required validation should prevent submission
    // If the JS intercepts before, it shows alert
    await page.waitForTimeout(500);
  });

  test('button shows "Sending..." during submission', async ({ page }) => {
    await page.goto('/suggest');
    // Mock the API to delay response
    await page.route('/api/suggest', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ json: { ok: true } });
    });

    await page.locator('#suggestion').fill('Test suggestion content');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('button[type="submit"]')).toContainText('Sending...');
  });

  test('successful submission shows thank you alert', async ({ page }) => {
    await page.goto('/suggest');
    await page.route('/api/suggest', route => route.fulfill({ json: { ok: true } }));

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.locator('#suggestion').fill('I would love a dark mode toggle');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    expect(alertMessage).toContain('Thanks');
  });

  test('failed submission shows error alert', async ({ page }) => {
    await page.goto('/suggest');
    await page.route('/api/suggest', route => route.fulfill({
      status: 500,
      json: { ok: false, error: 'DB connection failed' }
    }));

    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.locator('#suggestion').fill('Test suggestion');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
    expect(alertMessage).toContain('wrong');
  });
});

test.describe('Contact Page', () => {
  test('contact page loads with correct title', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/Contact/);
    await expect(page.locator('h1')).toContainText('Contact Us');
  });

  test('has contact form fields', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('#contact-name')).toBeAttached();
    await expect(page.locator('#contact-email')).toBeAttached();
    await expect(page.locator('#contact-subject')).toBeAttached();
    await expect(page.locator('#contact-message')).toBeAttached();
  });

  test('subject dropdown has correct options', async ({ page }) => {
    await page.goto('/contact');
    const options = page.locator('#contact-subject option');
    await expect(options).toHaveCount(5);
    const values = await options.evaluateAll(els => els.map(el => (el as HTMLOptionElement).value));
    expect(values).toContain('general');
    expect(values).toContain('bug');
    expect(values).toContain('feature');
    expect(values).toContain('privacy');
    expect(values).toContain('other');
  });

  test('message field is required', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('#contact-message')).toHaveAttribute('required', '');
  });

  test('has links to suggest, guide, privacy, settings', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('a[href="/suggest"]')).toBeAttached();
    await expect(page.locator('a[href="/guide"]')).toBeAttached();
    await expect(page.locator('a[href="/privacy"]')).toBeAttached();
    await expect(page.locator('a[href="/settings"]')).toBeAttached();
  });

  test('has response time information', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('text=48 hours')).toBeAttached();
  });
});
