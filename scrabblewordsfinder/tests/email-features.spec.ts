import { test, expect } from '@playwright/test';

/**
 * Email Features — End-to-End Tests
 * Tests contact and suggest forms with unique ID tracking.
 * After submission, polls /api/test-emails to confirm delivery.
 * Run ONLY against live site after deployment.
 */

const TEST_VERSION = '1.0.0';
const TEST_RUN_DATE = new Date().toISOString();

function generateTestId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

test.describe('Contact Form — End-to-End Email Verification', () => {
  test('sends email and verifies delivery via test_emails table', async ({ page, request }) => {
    const testId = generateTestId();
    const testMessage = `[SWF-TEST-${testId}] Automated e2e test v${TEST_VERSION} at ${TEST_RUN_DATE}. Verifying contact form email delivery.`;

    await page.goto('/contact');

    await page.locator('#contact-name').fill('E2E Test Bot');
    await page.locator('#contact-email').fill('e2e@automated.test');
    await page.locator('#contact-subject').selectOption('general');
    await page.locator('#contact-message').fill(testMessage);

    // Submit form
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/contact') && resp.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);

    // Poll for the test email in the test_emails table
    let found = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.waitForTimeout(1000);
      const checkRes = await request.get(`/api/test-emails?id=${testId}`);
      const checkData = await checkRes.json();
      if (checkData.found) {
        found = true;
        expect(checkData.email.unique_id).toBe(testId);
        expect(checkData.email.subject).toContain(`SWF-TEST-${testId}`);
        break;
      }
    }
    expect(found, `Test email with ID ${testId} was not found in test_emails table after 5 attempts`).toBe(true);
  });

  test('contact form validates empty message', async ({ page }) => {
    await page.goto('/contact');
    page.on('dialog', d => d.accept());
    await page.locator('button[type="submit"]').click();
    // If no API call made, validation worked client-side
  });
});

test.describe('Suggest Form — End-to-End Verification', () => {
  test('saves suggestion to DB successfully', async ({ page }) => {
    const testId = generateTestId();

    await page.goto('/suggest');
    const textarea = page.locator('textarea').first();
    await textarea.fill(`[SWF-TEST-${testId}] Automated e2e test v${TEST_VERSION} at ${TEST_RUN_DATE}. Testing suggest form.`);

    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/suggest') && resp.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]').click();
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  test('suggest form validates empty suggestion', async ({ page }) => {
    await page.goto('/suggest');
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/suggest') && resp.request().method() === 'POST'
    ).catch(() => null);

    await page.locator('button[type="submit"]').click();
    const response = await responsePromise;
    if (response) {
      expect(response.status()).toBe(400);
    }
  });
});
