import { test, expect } from '@playwright/test';

/**
 * Chat Page — AI Binding Status Indicator Tests (Animated Cogs + Online/Offline text)
 * Tests the animated SVG cogs status indicator next to the "AI Assistant" badge.
 * Healthy: spinning green center cog + blue/amber helper cogs + green "online" text.
 * Unhealthy: stuttering red center cog + stopped helpers + red "offline" text.
 */

test.describe('Chat AI Status Cogs — Positive', () => {
  test('status bot container exists beside AI Assistant badge', async ({ page }) => {
    await page.goto('/chat/');
    const statusBot = page.locator('#ai-status-bot');
    await expect(statusBot).toBeVisible();
  });

  test('SVG cogs icon element exists', async ({ page }) => {
    await page.goto('/chat/');
    const cogsIcon = page.locator('#ai-cogs-icon');
    await expect(cogsIcon).toBeAttached();
  });

  test('all three cog groups are present (center, top, bottom)', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#cog-center')).toBeAttached();
    await expect(page.locator('#cog-top')).toBeAttached();
    await expect(page.locator('#cog-bottom')).toBeAttached();
  });

  test('status text label exists', async ({ page }) => {
    await page.goto('/chat/');
    const statusText = page.locator('#ai-status-text');
    await expect(statusText).toBeAttached();
  });

  test('healthy AI activates spinning animations on all cogs', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 10 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 10 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    await expect(page.locator('#cog-center')).toHaveClass(/ai-cog-spin-cw/);
    await expect(page.locator('#cog-top')).toHaveClass(/ai-cog-spin-ccw/);
    await expect(page.locator('#cog-bottom')).toHaveClass(/ai-cog-spin-cw-slow/);
  });

  test('healthy AI removes opacity and adds active class', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    const cogsIcon = page.locator('#ai-cogs-icon');
    await expect(cogsIcon).toHaveClass(/ai-cogs-active/);
    await expect(cogsIcon).not.toHaveClass(/opacity-50/);
  });

  test('healthy AI shows green "online" text', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 3 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 3 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    const statusText = page.locator('#ai-status-text');
    await expect(statusText).toHaveText('online');
    await expect(statusText).toHaveClass(/text-green-400/);
  });

  test('healthy AI sets correct title tooltip', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    const statusBot = page.locator('#ai-status-bot');
    await expect(statusBot).toHaveAttribute('title', 'AI is online and ready');
  });

  test('unhealthy AI shows broken cog animation on center', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: false, chatusage: 0, reason: 'AI binding not configured' } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    const cogCenter = page.locator('#cog-center');
    await expect(cogCenter).toHaveClass(/ai-cog-broken/);
    await expect(cogCenter).not.toHaveClass(/ai-cog-spin-cw/);
  });

  test('unhealthy AI stops top and bottom cogs', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: false, chatusage: 0, reason: 'Down' } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    await expect(page.locator('#cog-top')).toHaveClass(/ai-cog-stopped/);
    await expect(page.locator('#cog-top')).not.toHaveClass(/ai-cog-spin-ccw/);
    await expect(page.locator('#cog-bottom')).toHaveClass(/ai-cog-stopped/);
    await expect(page.locator('#cog-bottom')).not.toHaveClass(/ai-cog-spin-cw-slow/);
  });

  test('unhealthy AI shows red "offline" text', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: false, chatusage: 0, reason: 'AI inference failed' } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    const statusText = page.locator('#ai-status-text');
    await expect(statusText).toHaveText('offline');
    await expect(statusText).toHaveClass(/text-red-400/);
  });

  test('unhealthy AI sets offline title with reason', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: false, chatusage: 0, reason: 'AI inference failed' } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    const statusBot = page.locator('#ai-status-bot');
    await expect(statusBot).toHaveAttribute('title', 'AI offline: AI inference failed');
  });
});

test.describe('Chat AI Status Cogs — Negative', () => {
  test('no duplicate status bot elements', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#ai-status-bot')).toHaveCount(1);
  });

  test('no duplicate cogs SVG elements', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#ai-cogs-icon')).toHaveCount(1);
  });

  test('heartbeat API failure does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.abort('connectionfailed');
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1500);

    await expect(page.locator('#chat-input')).toBeVisible();
    await expect(page.locator('#send-btn')).toBeVisible();
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });

  test('heartbeat 500 shows broken/offline state gracefully', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    await expect(page.locator('#cog-center')).toHaveClass(/ai-cog-broken/);
    await expect(page.locator('#ai-status-text')).toHaveText('offline');
    await expect(page.locator('#ai-status-bot')).toHaveAttribute('title', /AI offline/);
  });

  test('cogs indicator does not interfere with chat functionality', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Test reply"}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('/api/chatusage/', async (route) => {
      await route.fulfill({ json: { success: true } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(500);

    await page.locator('#chat-input').fill('Test message');
    await page.locator('#send-btn').click();
    await page.waitForTimeout(1500);

    const botMsg = page.locator('#messages .msg-text', { hasText: 'Test reply' });
    await expect(botMsg).toBeVisible();
  });

  test('SVG cogs icon has aria-hidden for accessibility', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#ai-cogs-icon')).toHaveAttribute('aria-hidden', 'true');
  });
});
