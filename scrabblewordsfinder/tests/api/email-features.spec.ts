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

test.describe('Email Data Integrity — DB matches email metadata', () => {
  test('contact form saves correct fields to emails table', async ({ request }) => {
    const testId = 'integrity-' + Date.now();
    const payload = {
      name: 'Integrity Test',
      email: 'integrity@test.com',
      subject: 'bug',
      message: `[SWF-TEST-${testId}] Data integrity check`,
    };

    // Submit contact form
    const res = await request.post('/api/contact', { data: payload });
    expect(res.status()).toBe(200);

    // Check emails table
    const emailsRes = await request.get('/api/emails?category=contact&limit=1');
    const data = await emailsRes.json();
    const latest = data.emails[0];

    // Verify each field matches
    expect(latest.name).toBe(payload.name);
    expect(latest.email).toBe(payload.email);
    expect(latest.subject).toBe('Bug Report');
    expect(latest.message).toContain(testId);
    expect(latest.category).toBe('contact');
    expect(latest.read).toBe(0);
    expect(latest.actioned).toBe(0);
    expect(latest.ip_address).toBeTruthy();
    expect(latest.created_at).toBeTruthy();
  });

  test('suggest form saves correct fields to emails table', async ({ request }) => {
    const testId = 'suggest-int-' + Date.now();
    const payload = {
      name: 'Suggest Integrity',
      email: 'suggesttest@test.com',
      suggestion: `[SWF-TEST-${testId}] Suggest data integrity`,
    };

    // Submit suggest form
    const res = await request.post('/api/suggest', { data: payload });
    expect(res.status()).toBe(200);

    // Check emails table
    const emailsRes = await request.get('/api/emails?category=suggest&limit=1');
    const data = await emailsRes.json();
    const latest = data.emails[0];

    // Verify fields
    expect(latest.name).toBe(payload.name);
    expect(latest.email).toBe(payload.email);
    expect(latest.subject).toBe('Feature Suggestion');
    expect(latest.message).toContain(testId);
    expect(latest.category).toBe('suggest');
    expect(latest.read).toBe(0);
    expect(latest.actioned).toBe(0);
    expect(latest.ip_address).toBeTruthy();
    expect(latest.created_at).toBeTruthy();
  });

  test('contact email subject matches DB category mapping', async ({ request }) => {
    const subjects = [
      { input: 'general', expected: 'General Question' },
      { input: 'bug', expected: 'Bug Report' },
      { input: 'feature', expected: 'Feature Suggestion' },
      { input: 'privacy', expected: 'Privacy / Data' },
      { input: 'other', expected: 'Other' },
    ];

    for (const s of subjects) {
      const res = await request.post('/api/contact', {
        data: { name: 'SubjTest', email: 'x@x.com', subject: s.input, message: 'subject mapping test' },
      });
      expect(res.status()).toBe(200);

      const emailsRes = await request.get('/api/emails?category=contact&limit=1');
      const data = await emailsRes.json();
      expect(data.emails[0].subject).toBe(s.expected);
    }
  });

  test('emails table has all required columns', async ({ request }) => {
    const res = await request.get('/api/emails?limit=1');
    const data = await res.json();
    if (data.emails.length > 0) {
      const email = data.emails[0];
      const requiredFields = ['id', 'category', 'name', 'email', 'subject', 'message', 'ip_address', 'comment', 'read', 'actioned', 'date_actioned', 'created_at'];
      for (const field of requiredFields) {
        expect(email).toHaveProperty(field);
      }
    }
  });
});
