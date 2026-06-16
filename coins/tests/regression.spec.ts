import { test, expect } from '@playwright/test';

const pages = [
  { path: '/', title: 'xCrypto24' },
  { path: '/coins', title: 'Coin Tracker' },
  { path: '/blog', title: 'Blog' },
  { path: '/blog/bitcoin-halving-explained', title: 'Bitcoin Halving' },
  { path: '/blog/bitcoin-vs-gold', title: 'Bitcoin vs Gold' },
  { path: '/blog/understanding-bitcoin-supply', title: 'Bitcoin Supply' },
  { path: '/blog/understanding-cryptocurrency-basics', title: 'Cryptocurrency' },
  { path: '/about', title: 'About' },
  { path: '/contact', title: 'Contact' },
  { path: '/privacy', title: 'Privacy' },
  { path: '/terms', title: 'Terms' },
  { path: '/disclaimer', title: 'Disclaimer' },
  { path: '/suggest', title: 'Suggest' },
  { path: '/guide', title: 'Guide' },
  { path: '/profile', title: 'Profile' },
  { path: '/tech-stack', title: 'Tech Stack' },
  { path: '/releases', title: 'Release' },
  { path: '/crypto-bubbles', title: 'Crypto Bubbles' },
];

test.describe('Regression — All Pages Load', () => {
  for (const p of pages) {
    test(`${p.path} loads with status 200 and contains "${p.title}"`, async ({ page }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);
      const title = await page.title();
      expect(title.toLowerCase()).toContain(p.title.toLowerCase());
    });
  }
});

test.describe('SEO — Meta Tags', () => {
  for (const p of pages) {
    test(`${p.path} has meta description`, async ({ page }) => {
      await page.goto(p.path);
      const desc = await page.getAttribute('meta[name="description"]', 'content');
      expect(desc).toBeTruthy();
      expect(desc!.length).toBeGreaterThan(20);
    });
  }
});

test.describe('Navigation — Header Links', () => {
  const navPage = '/blog';
  test.skip('nav has Coins link', async ({ page }) => {
    await page.goto(navPage);
    const link = page.locator('a[href="/coins"]');
    await expect(link).toBeVisible();
  });

  test('nav has Blog link', async ({ page }) => {
    await page.goto(navPage);
    const link = page.locator('a[href="/blog"]');
    await expect(link).toBeVisible();
  });

  test('nav has Analysis link', async ({ page }) => {
    await page.goto(navPage);
    const link = page.locator('a[href="/admin/analysis"]').first();
    await expect(link).toBeVisible();
  });

  test('nav has Profile link', async ({ page }) => {
    await page.goto(navPage);
    const link = page.locator('a[href="/profile"]');
    await expect(link).toBeVisible();
  });
});

test.describe('Footer — Links Present', () => {
  test.skip('footer has all required links', async ({ page }) => {
    await page.goto(navPage);
    for (const href of ['/about', '/privacy', '/terms', '/disclaimer', '/contact', '/suggest']) {
      const link = page.locator(`footer a[href="${href}"]`);
      await expect(link).toBeVisible();
    }
  });

  test.skip('footer has version stamp linking to releases', async ({ page }) => {
    await page.goto(navPage);
    const link = page.locator('footer a[href="/releases"]');
    await expect(link).toBeVisible();
  });
});

test.describe('Coins Page — Core Features', () => {
  test('has Add Coin button', async ({ page }) => {
    await page.goto('/coins');
    await expect(page.locator('#addBtn')).toBeVisible();
  });

  test('has Scan New Coins button', async ({ page }) => {
    await page.goto('/coins');
    await expect(page.locator('#scanBtn')).toBeVisible();
  });

  test('has Update Latest button', async ({ page }) => {
    await page.goto('/coins');
    await expect(page.locator('#updateLatestBtn')).toBeVisible();
  });

  test('has filter buttons (Mkt Cap)', async ({ page }) => {
    await page.goto('/coins');
    await expect(page.locator('.mcap-filter').first()).toBeVisible();
  });

  test('has age filter buttons', async ({ page }) => {
    await page.goto('/coins');
    await expect(page.locator('.age-filter-btn').first()).toBeVisible();
  });
});

test.describe('Coins Page — Negative Tests', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/coins');
    await page.waitForTimeout(2000);
    const critical = errors.filter(e => !e.includes('fetch') && !e.includes('net::'));
    expect(critical).toHaveLength(0);
  });

  test('API returns JSON for /api/coins', async ({ request }) => {
    const res = await request.get('/api/coins');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('coins');
    expect(Array.isArray(json.coins)).toBe(true);
  });
});

test.describe('API — Clicks Endpoint', () => {
  test('GET /api/clicks?count=true returns total', async ({ request }) => {
    const res = await request.get('/api/clicks?count=true');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('total');
    expect(typeof json.total).toBe('number');
  });

  test('GET /api/clicks returns array', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=5');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('clicks');
    expect(Array.isArray(json.clicks)).toBe(true);
  });

  test('POST /api/clicks records a click', async ({ request }) => {
    const res = await request.post('/api/clicks', {
      data: { user_id: 'test-user', ui_element: 'test-button', url: '/test', session_id: 'test-session', page_title: 'Test' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});

test.describe('API — Emails Endpoint', () => {
  test('GET /api/emails returns list and stats', async ({ request }) => {
    const res = await request.get('/api/emails');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('emails');
    expect(json).toHaveProperty('stats');
    expect(Array.isArray(json.emails)).toBe(true);
  });

  test('POST /api/contact saves submission', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: 'Test User', email: 'test@test.com', subject: 'general', message: '[XCRYPTO-TEST] Regression test submission' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test('POST /api/suggest saves suggestion', async ({ request }) => {
    const res = await request.post('/api/suggest', {
      data: { name: 'Test User', email: 'test@test.com', message: '[XCRYPTO-TEST] Regression test suggestion' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test('POST /api/contact rejects empty message', async ({ request }) => {
    const res = await request.post('/api/contact', {
      data: { name: 'Test', message: '' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('API — Telemetry Endpoint', () => {
  test('GET /api/telemetry?history=true returns history array', async ({ request }) => {
    const res = await request.get('/api/telemetry?history=true');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty('history');
    expect(Array.isArray(json.history)).toBe(true);
  });
});

test.describe('Admin — OAuth Protection', () => {
  test('/admin redirects to login when not authenticated', async ({ page }) => {
    const res = await page.goto('/admin');
    const url = page.url();
    expect(url).toContain('auth');
  });

  test('/admin/emails redirects when not authenticated', async ({ page }) => {
    const res = await page.goto('/admin/emails');
    const url = page.url();
    expect(url).toContain('auth');
  });

  test('/admin/clicks redirects when not authenticated', async ({ page }) => {
    const res = await page.goto('/admin/clicks');
    const url = page.url();
    expect(url).toContain('auth');
  });
});

test.describe('Blog — New Bitcoin Posts', () => {
  const newPosts = [
    '/blog/what-is-bitcoin',
    '/blog/how-bitcoin-mining-works',
    '/blog/bitcoin-wallets-explained',
    '/blog/bitcoin-vs-ethereum',
    '/blog/how-bitcoin-transactions-work',
    '/blog/bitcoin-security-best-practices',
    '/blog/bitcoin-myths-debunked',
  ];

  for (const path of newPosts) {
    test(`${path} loads with 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  }
});

test.describe('Cookie Consent — Positive', () => {
  test('cookie banner appears on first visit', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('xcrypto_cookie_consent'));
    await page.goto('/');
    const banner = page.locator('#cookieConsent');
    await expect(banner).toBeVisible();
  });

  test('accept hides banner and sets localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('xcrypto_cookie_consent'));
    await page.goto('/');
    await page.click('#cookieAccept');
    const banner = page.locator('#cookieConsent');
    await expect(banner).not.toBeVisible();
    const val = await page.evaluate(() => localStorage.getItem('xcrypto_cookie_consent'));
    expect(val).toBe('accepted');
  });
});

test.describe('Cookie Consent — Negative', () => {
  test('decline hides banner and sets declined', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('xcrypto_cookie_consent'));
    await page.goto('/');
    await page.click('#cookieDecline');
    const banner = page.locator('#cookieConsent');
    await expect(banner).not.toBeVisible();
    const val = await page.evaluate(() => localStorage.getItem('xcrypto_cookie_consent'));
    expect(val).toBe('declined');
  });

  test('banner does not reappear after acceptance', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('xcrypto_cookie_consent', 'accepted'));
    await page.goto('/blog');
    const banner = page.locator('#cookieConsent');
    await expect(banner).not.toBeVisible();
  });
});
