import { test, expect } from '@playwright/test';

/**
 * Chat Page (Lex AI Assistant) — Layout & Feature Tests
 *
 * Covers the two-column layout, chat UI elements, right sidebar alignment,
 * and key interactive components.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    const response = await page.goto(`${BASE}/chat/`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Lex/i);
  });

  test('chat container is visible', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const container = page.locator('#chat-container');
    await expect(container).toBeVisible();
  });

  test('chat input and send button exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#chat-input')).toBeVisible();
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('rack input and Ask Lex button exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#rack-input')).toBeVisible();
    await expect(page.locator('#ask-lex-btn')).toBeVisible();
  });

  test('quick prompt buttons are visible', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const prompts = page.locator('.quick-prompt');
    const count = await prompts.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('right column is aligned with left column (no excessive top margin)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.setViewportSize({ width: 1280, height: 720 });
    // The right column should start near the top of the flex row.
    // Before the fix, mt-[190px] pushed it ~190px lower than expected.
    const rightCol = page.locator('.lg\\:w-64.xl\\:w-72');
    // Get parent flex container to compare against
    const flexRow = page.locator('main .flex.flex-col.lg\\:flex-row');
    const rightBox = await rightCol.boundingBox();
    const parentBox = await flexRow.boundingBox();
    expect(rightBox).not.toBeNull();
    expect(parentBox).not.toBeNull();
    // The right column should start within 50px of the parent top (no big margin offset)
    const yDelta = rightBox!.y - parentBox!.y;
    expect(yDelta).toBeLessThan(50);
  });

  test('two-column layout is a flex row on desktop', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.setViewportSize({ width: 1280, height: 720 });
    const flexRow = page.locator('main .flex.flex-col.lg\\:flex-row');
    await expect(flexRow).toBeAttached();
  });

  test('welcome message from Lex is displayed', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const messages = page.locator('#messages');
    const text = await messages.textContent();
    expect(text).toContain('Lex');
  });

  test('FAQPage schema is present', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const text = await schema.first().textContent();
    expect(text).toContain('FAQPage');
  });

  test('voice input (mic) button exists', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#mic-btn')).toBeVisible();
  });
});

test.describe('Chat Page — Negative', () => {
  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('no duplicate chat containers', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const containers = page.locator('#chat-container');
    const count = await containers.count();
    expect(count).toBe(1);
  });

  test('right column does not have mt-[190px] class (regression)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const rightCol = page.locator('.lg\\:w-64.xl\\:w-72');
    const cls = await rightCol.getAttribute('class');
    expect(cls).not.toContain('mt-[190px]');
  });

  test('no sensitive data exposed on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(body).not.toContain('AKIA');
    expect(body).not.toMatch(/@gmail\.com/);
  });
});
