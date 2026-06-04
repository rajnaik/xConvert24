import { test, expect } from '@playwright/test';

const BUGS_API = '/api/bugs';

// Collect bugs found during testing
const bugsFound: { page: string; href: string; severity: string; description: string }[] = [];

// ─── Homepage ──────────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
  test('loads and has correct title', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle(/xConvert24/);
  });

  test('has hero heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('has category cards with links', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('a[href^="/convert/"], a[href^="/tools/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(20);
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggleBtn = page.locator('#theme-toggle');
    await toggleBtn.click();
    await expect(html).toHaveClass(/dark/);
    await toggleBtn.click();
    await expect(html).not.toHaveClass(/dark/);
  });
});

// ─── Converter Pages ───────────────────────────────────────────────────────────

const converters = [
  { name: 'Weight', path: '/convert/weight' },
  { name: 'Length', path: '/convert/length' },
  { name: 'Temperature', path: '/convert/temperature' },
  { name: 'Area', path: '/convert/area' },
  { name: 'Volume', path: '/convert/volume' },
  { name: 'Speed', path: '/convert/speed' },
  { name: 'Data Storage', path: '/convert/data' },
  { name: 'Currency', path: '/convert/currency' },
  { name: 'Time', path: '/convert/time' },
  { name: 'Cooking', path: '/convert/cooking' },
  { name: 'Energy', path: '/convert/energy' },
  { name: 'Pressure', path: '/convert/pressure' },
  { name: 'Power', path: '/convert/power' },
  { name: 'Fuel Economy', path: '/convert/fuel' },
  { name: 'Angle', path: '/convert/angle' },
  { name: 'Frequency', path: '/convert/frequency' },
  { name: 'Number Base', path: '/convert/base' },
  { name: 'Roman Numerals', path: '/convert/roman' },
];

for (const conv of converters) {
  test.describe(`Converter: ${conv.name}`, () => {
    test(`loads successfully`, async ({ page }) => {
      const res = await page.goto(conv.path);
      if (res?.status() !== 200) {
        bugsFound.push({ page: conv.name, href: conv.path, severity: 'high', description: `Page returned HTTP ${res?.status()} instead of 200` });
      }
      expect(res?.status()).toBe(200);
    });

    test(`has h1 heading`, async ({ page }) => {
      await page.goto(conv.path);
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
    });

    test(`has no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.goto(conv.path);
      await page.waitForTimeout(1000);
      if (errors.length > 0) {
        bugsFound.push({ page: conv.name, href: conv.path, severity: 'medium', description: `Console errors: ${errors.join('; ')}` });
      }
      expect(errors).toHaveLength(0);
    });
  });
}

// ─── Tools Pages ───────────────────────────────────────────────────────────────

const tools = [
  { name: 'BMI Calculator', path: '/tools/bmi' },
  { name: 'Color Picker', path: '/tools/color' },
  { name: 'World Clock', path: '/tools/clock' },
  { name: 'Scientific Calculator', path: '/tools/calculator' },
  { name: 'Tip Calculator', path: '/tools/tip' },
  { name: 'Discount Calculator', path: '/tools/discount' },
  { name: 'Loan Calculator', path: '/tools/loan' },
  { name: 'Age Calculator', path: '/tools/age' },
  { name: 'Date Difference', path: '/tools/date-diff' },
];

for (const tool of tools) {
  test.describe(`Tool: ${tool.name}`, () => {
    test(`loads successfully`, async ({ page }) => {
      const res = await page.goto(tool.path);
      if (res?.status() !== 200) {
        bugsFound.push({ page: tool.name, href: tool.path, severity: 'high', description: `Page returned HTTP ${res?.status()} instead of 200` });
      }
      expect(res?.status()).toBe(200);
    });

    test(`has no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.goto(tool.path);
      await page.waitForTimeout(1000);
      if (errors.length > 0) {
        bugsFound.push({ page: tool.name, href: tool.path, severity: 'medium', description: `Console errors: ${errors.join('; ')}` });
      }
      expect(errors).toHaveLength(0);
    });
  });
}

// ─── Static Pages ──────────────────────────────────────────────────────────────

const staticPages = [
  { name: 'Search', path: '/search' },
  { name: 'About', path: '/about' },
  { name: 'Privacy', path: '/privacy' },
  { name: 'Cookies', path: '/cookies' },
  { name: 'Terms', path: '/terms' },
  { name: 'Contact', path: '/contact' },
  { name: 'Releases', path: '/releases' },
  { name: 'Report Bug', path: '/report-bug' },
  { name: 'Vote Bugs', path: '/vote-bugs' },
];

for (const sp of staticPages) {
  test(`Static page: ${sp.name} loads`, async ({ page }) => {
    const res = await page.goto(sp.path);
    if (res?.status() !== 200) {
      bugsFound.push({ page: sp.name, href: sp.path, severity: 'high', description: `Page returned HTTP ${res?.status()} instead of 200` });
    }
    expect(res?.status()).toBe(200);
  });
}

// ─── 404 Page ──────────────────────────────────────────────────────────────────

test('404 page works for invalid URLs', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist');
  expect(res?.status()).toBe(404);
  const content = await page.textContent('h1');
  expect(content).toContain('convert');
});

// ─── API Endpoints ─────────────────────────────────────────────────────────────

test.describe('API', () => {
  test('GET /api/bugs returns JSON with bugs array', async ({ request }) => {
    const res = await request.get(BUGS_API);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('bugs');
    expect(Array.isArray(data.bugs)).toBe(true);
    expect(data.bugs.length).toBeGreaterThan(0);
  });

  test('POST /api/bugs rejects empty description', async ({ request }) => {
    const res = await request.post(BUGS_API, {
      data: { page: 'Test', severity: 'low', description: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/bugs accepts valid bug report', async ({ request }) => {
    const res = await request.post(BUGS_API, {
      data: {
        page: 'Playwright Test',
        href: '/test',
        severity: 'low',
        description: 'Automated test bug — can be deleted',
        email: 'playwright@test.com',
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.id).toBeTruthy();
  });
});

// ─── Functional Tests ──────────────────────────────────────────────────────────

test.describe('Weight Converter functionality', () => {
  test('converts 1 kg to ~2.205 lbs', async ({ page }) => {
    await page.goto('/convert/weight');
    const fromUnit = page.locator('#from-unit');
    const toUnit = page.locator('#to-unit');
    const fromValue = page.locator('#from-value');
    const result = page.locator('#result');

    await fromUnit.selectOption('kg');
    await toUnit.selectOption('lb');
    await fromValue.fill('1');
    await page.waitForTimeout(300);
    const text = await result.textContent();
    const num = parseFloat(text || '0');
    if (num < 2.2 || num > 2.21) {
      bugsFound.push({ page: 'Weight Converter', href: '/convert/weight', severity: 'high', description: `1 kg → lb gave ${text}, expected ~2.20462` });
    }
    expect(num).toBeCloseTo(2.20462, 2);
  });

  test('swap button works', async ({ page }) => {
    await page.goto('/convert/weight');
    const fromUnit = page.locator('#from-unit');
    const toUnit = page.locator('#to-unit');
    await fromUnit.selectOption('kg');
    await toUnit.selectOption('lb');
    await page.locator('#swap-btn').click();
    await expect(fromUnit).toHaveValue('lb');
    await expect(toUnit).toHaveValue('kg');
  });
});

test.describe('Temperature Converter functionality', () => {
  test('converts 100°C to 212°F', async ({ page }) => {
    await page.goto('/convert/temperature');
    const fromUnit = page.locator('#from-unit');
    const toUnit = page.locator('#to-unit');
    const fromValue = page.locator('#from-value');
    const result = page.locator('#result');

    await fromUnit.selectOption('c');
    await toUnit.selectOption('f');
    await fromValue.fill('100');
    await page.waitForTimeout(300);
    const text = await result.textContent();
    const num = parseFloat(text || '0');
    expect(num).toBe(212);
  });

  test('converts 0°C to 32°F', async ({ page }) => {
    await page.goto('/convert/temperature');
    await page.locator('#from-unit').selectOption('c');
    await page.locator('#to-unit').selectOption('f');
    await page.locator('#from-value').fill('0');
    await page.waitForTimeout(300);
    const text = await page.locator('#result').textContent();
    expect(parseFloat(text || '0')).toBe(32);
  });
});

// ─── Report bugs found during testing ──────────────────────────────────────────

test.afterAll(async ({ request }) => {
  if (bugsFound.length === 0) return;
  console.log(`\n🐛 Reporting ${bugsFound.length} bugs found during testing:\n`);
  for (const bug of bugsFound) {
    console.log(`  • [${bug.severity.toUpperCase()}] ${bug.page}: ${bug.description}`);
    try {
      await request.post(BUGS_API, { data: bug });
    } catch {
      console.log(`    ⚠️ Failed to submit bug to API`);
    }
  }
});
