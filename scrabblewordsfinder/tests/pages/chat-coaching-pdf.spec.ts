import { test, expect } from '@playwright/test';

/**
 * Chat Coaching PDF — Script Loading & Global Functions
 *
 * Verifies that jsPDF CDN and coaching-pdf.js scripts load on the chat page,
 * exposing global functions for PDF generation and localStorage report management.
 *
 * File changed: src/pages/chat.astro (added jspdf + coaching-pdf.js script tags)
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Coaching PDF — Positive', () => {
  test('jsPDF CDN script tag is present on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const script = page.locator('script[src*="jspdf"]');
    await expect(script).toBeAttached();
  });

  test('coaching-pdf.js script tag is present on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const script = page.locator('script[src="/js/coaching-pdf.js"]');
    await expect(script).toBeAttached();
  });

  test('generateCoachingPDF is a globally available function', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const exists = await page.evaluate(() => typeof (window as any).generateCoachingPDF === 'function');
    expect(exists).toBe(true);
  });

  test('getStoredReports is a globally available function', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const exists = await page.evaluate(() => typeof (window as any).getStoredReports === 'function');
    expect(exists).toBe(true);
  });

  test('saveReportToStorage is a globally available function', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const exists = await page.evaluate(() => typeof (window as any).saveReportToStorage === 'function');
    expect(exists).toBe(true);
  });

  test('deleteStoredReport is a globally available function', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const exists = await page.evaluate(() => typeof (window as any).deleteStoredReport === 'function');
    expect(exists).toBe(true);
  });

  test('appendCoachingPDFButtons is a globally available function', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const exists = await page.evaluate(() => typeof (window as any).appendCoachingPDFButtons === 'function');
    expect(exists).toBe(true);
  });

  test('getStoredReports returns empty array initially', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const reports = await page.evaluate(() => {
      localStorage.removeItem('swf-coaching-reports');
      return (window as any).getStoredReports();
    });
    expect(reports).toEqual([]);
  });

  test('saveReportToStorage adds a report and returns updated list', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(() => {
      localStorage.removeItem('swf-coaching-reports');
      const report = { id: 'test-1', type: 'quiz', title: 'Quiz Report', date: '2026-07-02', base64: 'data:test' };
      return (window as any).saveReportToStorage(report);
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('test-1');
  });

  test('saveReportToStorage enforces rolling max of 5 reports', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(() => {
      localStorage.removeItem('swf-coaching-reports');
      for (let i = 1; i <= 7; i++) {
        (window as any).saveReportToStorage({ id: 'r-' + i, type: 'quiz', title: 'Report ' + i, date: '2026-07-0' + i, base64: 'data:' + i });
      }
      return (window as any).getStoredReports();
    });
    expect(result).toHaveLength(5);
    // Most recent should be first
    expect(result[0].id).toBe('r-7');
  });

  test('deleteStoredReport removes specific report by ID', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(() => {
      localStorage.removeItem('swf-coaching-reports');
      (window as any).saveReportToStorage({ id: 'keep', type: 'rack', title: 'Keep', date: '2026-07-01', base64: 'x' });
      (window as any).saveReportToStorage({ id: 'remove', type: 'rack', title: 'Remove', date: '2026-07-02', base64: 'y' });
      return (window as any).deleteStoredReport('remove');
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('keep');
  });

  test('jsPDF CDN resource is requested on page load', async ({ page }) => {
    const jspdfRequests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('jspdf')) {
        jspdfRequests.push(req.url());
      }
    });
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(1000);
    expect(jspdfRequests.length).toBeGreaterThan(0);
    expect(jspdfRequests[0]).toContain('jspdf.umd.min.js');
  });
});

test.describe('Chat Coaching PDF — Negative', () => {
  test('no duplicate jsPDF script tags on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const scripts = page.locator('script[src*="jspdf"]');
    const count = await scripts.count();
    expect(count).toBe(1);
  });

  test('no duplicate coaching-pdf.js script tags on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const scripts = page.locator('script[src="/js/coaching-pdf.js"]');
    const count = await scripts.count();
    expect(count).toBe(1);
  });

  test('no console errors from coaching-pdf.js loading', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);

    const pdfErrors = errors.filter(e =>
      e.includes('coaching') || e.includes('jspdf') || e.includes('jsPDF')
    );
    expect(pdfErrors).toHaveLength(0);
  });

  test('getStoredReports handles corrupted localStorage gracefully', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(() => {
      localStorage.setItem('swf-coaching-reports', '{invalid json!!!');
      return (window as any).getStoredReports();
    });
    expect(result).toEqual([]);
  });

  test('coaching-pdf scripts are NOT loaded on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const jspdfScript = page.locator('script[src*="jspdf"]');
    const coachingScript = page.locator('script[src="/js/coaching-pdf.js"]');
    expect(await jspdfScript.count()).toBe(0);
    expect(await coachingScript.count()).toBe(0);
  });

  test('coaching-pdf.js contains Manage Storage link pointing to /settings/#coaching-reports', async ({ page }) => {
    const response = await page.goto(`${BASE}/js/coaching-pdf.js`);
    const body = await response!.text();
    expect(body).toContain('Manage Storage');
    expect(body).toContain('/settings/#coaching-reports');
  });
});
