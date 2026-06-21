import { test, expect } from '@playwright/test';

/**
 * Click Tracking Tests — Global Click Tracker + Solver Focus
 *
 * The global click tracker captures ALL interactive element clicks and sends
 * them to /api/clicks. The solver focus tracker still fires "Solver" on input focus.
 * Admin pages (/admin/*) are excluded from tracking.
 *
 * UID key: 'swf-uid' (generates u_<timestamp><random> format)
 * Element description priority: aria-label → data-track → title → textContent(60) → id → name → tagName
 * Skipped elements: "Refresh"/"🔄 Refresh", generic tags (SPAN, DIV, IMG, P)
 */

test.describe('Global Click Tracker — Positive', () => {
  test('clicking a button sends a click event to /api/clicks', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Click the solve button — should fire a click event
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);

    const buttonClicks = payloads.filter(p => p.ui_element !== 'Solver');
    expect(buttonClicks.length).toBeGreaterThanOrEqual(1);
  });

  test('clicking a navigation link sends a click event', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (url.includes('/api/clicks') && route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Click any visible nav link
    const navLink = page.locator('nav a[href]').first();
    if (await navLink.count() > 0) {
      await navLink.click({ noWaitAfter: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    const linkClicks = payloads.filter(p => p.ui_element !== 'Solver');
    expect(linkClicks.length).toBeGreaterThanOrEqual(1);
  });

  test('click payload contains user_id, ui_element, and url', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);

    const clickEvent = payloads.find(p => p.ui_element !== 'Solver');
    expect(clickEvent).toBeTruthy();
    expect(clickEvent.user_id).toBeTruthy();
    expect(clickEvent.ui_element).toBeTruthy();
    expect(clickEvent.url).toBe('/');
  });

  test('element description uses aria-label when available', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Find a button with aria-label and click it
    const ariaBtn = page.locator('button[aria-label]').first();
    if (await ariaBtn.count() > 0) {
      const expectedLabel = await ariaBtn.getAttribute('aria-label');
      await ariaBtn.click();
      await page.waitForTimeout(500);

      const match = payloads.find(p => p.ui_element === expectedLabel);
      expect(match).toBeTruthy();
    }
  });
});

test.describe('Global Click Tracker — UID Management', () => {
  test('uses swf-uid localStorage key for user identification', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__swfStore = (window as any).__swfStore || {
        getRaw: (k: string) => localStorage.getItem(k),
        setRaw: (k: string, v: string) => localStorage.setItem(k, v),
      };
      localStorage.setItem('swf-uid', 'test-uid-global-123');
    });

    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);

    const clickEvent = payloads.find(p => p.ui_element !== 'Solver');
    expect(clickEvent).toBeTruthy();
    expect(clickEvent.user_id).toBe('test-uid-global-123');
  });

  test('creates swf-uid on first click if none exists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(500);

    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);

    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBeTruthy();
    expect(uid!.startsWith('u_')).toBe(true);
  });

  test('reuses existing swf-uid across multiple clicks', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__swfStore = (window as any).__swfStore || {
        getRaw: (k: string) => localStorage.getItem(k),
        setRaw: (k: string, v: string) => localStorage.setItem(k, v),
      };
      localStorage.setItem('swf-uid', 'persistent-uid-456');
    });

    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(300);

    // Click a second interactive element
    const link = page.locator('a[href]').first();
    if (await link.count() > 0) {
      await link.click({ noWaitAfter: true }).catch(() => {});
      await page.waitForTimeout(300);
    }

    for (const event of payloads) {
      expect(event.user_id).toBe('persistent-uid-456');
    }
  });
});

test.describe('Global Click Tracker — Negative', () => {
  test('does not track clicks on admin pages', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin');
    await page.waitForTimeout(500);

    // Try to click anything on admin page
    const btn = page.locator('button, a').first();
    if (await btn.count() > 0) {
      await btn.click({ noWaitAfter: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    expect(payloads).toHaveLength(0);
  });

  test('does not track clicks on non-interactive elements', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Click on a non-interactive element (paragraph, heading, etc.)
    const nonInteractive = page.locator('p, h1, h2, h3').first();
    if (await nonInteractive.count() > 0) {
      await nonInteractive.click();
      await page.waitForTimeout(500);
    }

    // Should have zero events (excluding any Solver focus that might fire)
    const nonSolverClicks = payloads.filter(p => p.ui_element !== 'Solver');
    expect(nonSolverClicks).toHaveLength(0);
  });

  test('skips "Refresh" button clicks', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Inject a Refresh button to test the skip logic
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.textContent = '🔄 Refresh';
      btn.id = 'test-refresh-btn';
      document.body.appendChild(btn);
    });

    await page.locator('#test-refresh-btn').click();
    await page.waitForTimeout(500);

    const refreshClicks = payloads.filter(p =>
      p.ui_element === '🔄 Refresh' || p.ui_element === 'Refresh'
    );
    expect(refreshClicks).toHaveLength(0);
  });

  test('skips generic tag-only elements (SPAN, DIV, IMG, P)', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Add a button with only SPAN as text content (edge case where describeElement might return "SPAN")
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'test-span-btn';
      // Remove all describable attributes so it falls through to tagName
      const span = document.createElement('span');
      span.textContent = ''; // empty span
      btn.appendChild(span);
      document.body.appendChild(btn);
    });

    // This button should still be tracked (tagName fallback returns "button" not "SPAN")
    await page.locator('#test-span-btn').click();
    await page.waitForTimeout(500);

    // "button" is not in the skip list, so it should be tracked
    const btnClicks = payloads.filter(p => p.ui_element === 'button');
    expect(btnClicks.length).toBeGreaterThanOrEqual(1);
  });

  test('does not crash when fetch fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('/api/clicks', route => {
      route.abort('connectionrefused');
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);

    // No page errors should occur — fetch failure is silently handled
    const criticalErrors = errors.filter(e => e.includes('click'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('truncates element text content to 60 characters', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Add a button with very long text
    const longText = 'A'.repeat(100);
    await page.evaluate((text) => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.id = 'test-long-text-btn';
      document.body.appendChild(btn);
    }, longText);

    await page.locator('#test-long-text-btn').click();
    await page.waitForTimeout(500);

    const longClick = payloads.find(p => p.ui_element && p.ui_element.includes('AAA'));
    expect(longClick).toBeTruthy();
    expect(longClick.ui_element.length).toBeLessThanOrEqual(60);
  });
});

test.describe('Solver Focus Tracker — Positive', () => {
  test('focusing solver input sends "Solver" to /api/clicks', async ({ page }) => {
    let focusPayload: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.ui_element === 'Solver') {
          focusPayload = body;
        }
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solver').focus();
    await page.waitForTimeout(400);

    expect(focusPayload).toBeTruthy();
    expect(focusPayload.ui_element).toBe('Solver');
    expect(focusPayload.user_id).toBeTruthy();
    expect(focusPayload.url).toBe('/');
  });

  test('solver focus uses swf-uid key for user identification', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__swfStore = (window as any).__swfStore || {
        getRaw: (k: string) => localStorage.getItem(k),
        setRaw: (k: string, v: string) => localStorage.setItem(k, v),
      };
      localStorage.setItem('swf-uid', 'solver-test-uid-789');
    });

    let focusPayload: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.ui_element === 'Solver') {
          focusPayload = body;
        }
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solver').focus();
    await page.waitForTimeout(400);

    expect(focusPayload).toBeTruthy();
    expect(focusPayload.user_id).toBe('solver-test-uid-789');
  });
});

test.describe('Solver Focus Tracker — Negative', () => {
  test('focusing a non-solver input does NOT send a "Solver" event', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Focus any non-solver input (e.g., search bar, if it exists)
    const otherInput = page.locator('input:not([data-track="SolverUsed"])').first();
    if (await otherInput.count() > 0) {
      await otherInput.focus();
      await page.waitForTimeout(400);
    }

    const solverEvents = payloads.filter(p => p.ui_element === 'Solver');
    expect(solverEvents).toHaveLength(0);
  });
});

test.describe('GET /api/clicks — Ordering & Filters — Positive', () => {
  test('returns clicks ordered by id descending (newest first)', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=10');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.clicks).toBeDefined();
    expect(Array.isArray(data.clicks)).toBe(true);

    if (data.clicks.length >= 2) {
      // Each click's id should be >= the next (descending order)
      for (let i = 0; i < data.clicks.length - 1; i++) {
        expect(data.clicks[i].id).toBeGreaterThan(data.clicks[i + 1].id);
      }
    }
  });

  test('respects limit parameter', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=3');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.clicks.length).toBeLessThanOrEqual(3);
  });

  test('returns total count alongside results', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=5');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.total).toBeDefined();
    expect(typeof data.total).toBe('number');
    expect(data.total).toBeGreaterThanOrEqual(data.clicks.length);
  });

  test('count=true returns only total without click rows', async ({ request }) => {
    const res = await request.get('/api/clicks?count=true');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.total).toBeDefined();
    expect(typeof data.total).toBe('number');
    // Should not have a clicks array in count-only mode
    expect(data.clicks).toBeUndefined();
  });

  test('filter by ui_element returns matching clicks', async ({ request }) => {
    const res = await request.get('/api/clicks?ui_element=Solver&limit=5');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    for (const click of data.clicks) {
      expect(click.ui_element).toBe('Solver');
    }
  });
});

test.describe('GET /api/clicks — Ordering & Filters — Negative', () => {
  test('handles very large limit gracefully (capped at 500)', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=9999');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    // Server caps at 500
    expect(data.clicks.length).toBeLessThanOrEqual(500);
  });

  test('handles non-numeric limit without crashing', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=abc');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    // Should fall back to default (50)
    expect(data.clicks.length).toBeLessThanOrEqual(50);
  });

  test('returns empty array when filtering by non-existent ui_element', async ({ request }) => {
    const res = await request.get('/api/clicks?ui_element=NonExistentElement_xyz_12345');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.clicks).toHaveLength(0);
  });

  test('search with no matches returns empty clicks array', async ({ request }) => {
    const res = await request.get('/api/clicks?search=zzz_impossible_string_999');
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.clicks).toHaveLength(0);
  });
});

test.describe('Live Click Counter — Positive', () => {
  test('fetches total count on page load', async ({ page }) => {
    await page.route('/api/clicks/?count=true', route => {
      route.fulfill({ json: { total: 12345 } });
    });

    await page.goto('/');
    const counter = page.locator('#footer-clicks-value');
    if (await counter.isVisible()) {
      await expect(counter).toContainText('12,345');
    }
  });

  test('footer click counter element exists', async ({ page }) => {
    await page.goto('/');
    const counter = page.locator('#footer-clicks');
    await expect(counter).toBeVisible();
  });
});

test.describe('Live Click Counter — Negative', () => {
  test('counter handles API failure gracefully (no crash)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('/api/clicks/?count=true', route => {
      route.fulfill({ status: 500, body: 'Internal error' });
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Page should not crash
    const counter = page.locator('#footer-clicks-value');
    if (await counter.isVisible()) {
      const text = await counter.textContent();
      expect(text).toBeTruthy();
    }

    const criticalErrors = errors.filter(e => e.includes('clicks'));
    expect(criticalErrors).toHaveLength(0);
  });
});
