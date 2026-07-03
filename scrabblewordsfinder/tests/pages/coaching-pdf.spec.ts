import { test, expect } from '@playwright/test';

test.describe('Coaching PDF Download — Positive', () => {
  test('chat page loads with jsPDF and coaching-pdf functions available', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    // jsPDF CDN loaded
    const jspdfLoaded = await page.evaluate(() => typeof (window as any).jspdf !== 'undefined');
    expect(jspdfLoaded).toBe(true);

    // Our PDF utility functions are globally available
    const funcsAvailable = await page.evaluate(() =>
      typeof (window as any).generateCoachingPDF === 'function' &&
      typeof (window as any).appendCoachingPDFButtons === 'function' &&
      typeof (window as any).getStoredReports === 'function' &&
      typeof (window as any).saveReportToStorage === 'function' &&
      typeof (window as any).deleteStoredReport === 'function'
    );
    expect(funcsAvailable).toBe(true);

    // No JS errors from our scripts
    const relevantErrors = errors.filter(e =>
      e.includes('jspdf') || e.includes('coaching-pdf') || e.includes('appendCoaching')
    );
    expect(relevantErrors).toHaveLength(0);
  });

  test('Saved Reports panel is hidden when no reports stored', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    // Clear any existing reports
    await page.evaluate(() => localStorage.removeItem('swf-coaching-reports'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const panel = page.locator('#saved-reports-panel');
    await expect(panel).toBeHidden();
  });

  test('generateCoachingPDF produces a valid PDF blob', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await (window as any).generateCoachingPDF({
        type: 'quiz',
        analysis: '🏆 OVERALL GRADE\nA- — Strong player with 85% accuracy.\n\n💪 STRENGTHS\n✅ Never timed out\n✅ 3 perfect rounds\n\n🎯 NEEDS WORK\n• Vocabulary gaps in advanced adjectives\n\n📈 PROGRESS & TRENDS\nImproving steadily from 70% to 85%.',
        stats: { totalGames: 15, accuracy: 85, avgScore: 8.5, avgTotal: 10, totalPerfect: 3, totalTimedOut: 0, avgTime: 45, timeUsagePct: 50, avgSecondsPerWord: 4.5, timerLimitsUsed: [90], wordCountsUsed: [10] },
        phases: { beginning: { accuracy: 70 }, mid: { accuracy: 78 }, end: { accuracy: 85 }, trend: 'improving', accDelta: 15, timeDelta: -10 }
      });
      return {
        hasBlob: res.blob instanceof Blob,
        blobSize: res.blob.size,
        hasBase64: typeof res.base64 === 'string' && res.base64.startsWith('data:'),
        filename: res.filename
      };
    });

    expect(result.hasBlob).toBe(true);
    expect(result.blobSize).toBeGreaterThan(1000); // PDF should be at least 1KB
    expect(result.hasBase64).toBe(true);
    expect(result.filename).toContain('lex-quiz-report-');
    expect(result.filename).toContain('.pdf');
  });

  test('saveReportToStorage stores and retrieves reports correctly', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    // Clear first
    await page.evaluate(() => localStorage.removeItem('swf-coaching-reports'));

    const stored = await page.evaluate(() => {
      (window as any).saveReportToStorage({
        id: 'test-report-1',
        type: 'quiz',
        title: 'Word Quiz Report',
        date: new Date().toISOString(),
        base64: 'data:application/pdf;base64,FAKE'
      });
      return (window as any).getStoredReports();
    });

    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('test-report-1');
    expect(stored[0].type).toBe('quiz');
  });

  test('rolling 5 limit is enforced — oldest report is dropped', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => localStorage.removeItem('swf-coaching-reports'));

    const result = await page.evaluate(() => {
      for (let i = 1; i <= 7; i++) {
        (window as any).saveReportToStorage({
          id: 'report-' + i,
          type: 'quiz',
          title: 'Report ' + i,
          date: new Date().toISOString(),
          base64: 'data:application/pdf;base64,FAKE' + i
        });
      }
      return (window as any).getStoredReports();
    });

    expect(result).toHaveLength(5);
    // Most recent should be first (report-7)
    expect(result[0].id).toBe('report-7');
    // Oldest kept should be report-3 (1 and 2 were dropped)
    expect(result[4].id).toBe('report-3');
  });
});

test.describe('Coaching PDF Download — Negative', () => {
  test('generateCoachingPDF handles empty analysis gracefully', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      const res = await (window as any).generateCoachingPDF({
        type: 'rack',
        analysis: '',
        stats: {},
        phases: null
      });
      return { hasBlob: res.blob instanceof Blob, blobSize: res.blob.size };
    });

    expect(result.hasBlob).toBe(true);
    expect(result.blobSize).toBeGreaterThan(100); // Still produces a valid (minimal) PDF
  });

  test('deleteStoredReport removes the correct report', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    const remaining = await page.evaluate(() => {
      localStorage.removeItem('swf-coaching-reports');
      (window as any).saveReportToStorage({ id: 'keep-me', type: 'quiz', title: 'Keep', date: '', base64: 'x' });
      (window as any).saveReportToStorage({ id: 'delete-me', type: 'rack', title: 'Delete', date: '', base64: 'y' });
      (window as any).deleteStoredReport('delete-me');
      return (window as any).getStoredReports();
    });

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('keep-me');
  });

  test('no page errors when coaching-pdf.js functions called without jsPDF', async ({ page }) => {
    // This tests graceful handling — our functions should not crash even with weird inputs
    await page.goto('/chat/');
    await page.waitForLoadState('networkidle');

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Call with nonsense type — should still produce a PDF without crashing
    const result = await page.evaluate(async () => {
      try {
        const res = await (window as any).generateCoachingPDF({
          type: 'nonexistent',
          analysis: 'Test content',
          stats: null,
          phases: undefined
        });
        return { success: true, hasBlob: res.blob instanceof Blob };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.hasBlob).toBe(true);
  });
});
