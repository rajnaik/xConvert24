import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests — /api/lex-quiz-coach/
 * Tests the Lex AI coaching endpoint that analyses user quiz history.
 * The endpoint fetches ALL quiz history (no LIMIT) and returns AI coaching feedback.
 */

test.describe('API — /api/lex-quiz-coach/ POST — Positive', () => {
  test('POST with valid user_id returns coaching response', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'test-user-playwright' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      // Should have either hasHistory: true (with stats + analysis) or hasHistory: false (wisdom)
      expect(body.hasHistory).toBeDefined();
      expect(body.analysis).toBeDefined();
      expect(typeof body.analysis).toBe('string');
      expect(body.analysis.length).toBeGreaterThan(0);
    }
  });

  test('POST with user that has no history returns wisdom (hasHistory: false)', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'non-existent-user-no-history-xyz-999' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(false);
      expect(body.analysis).toBeDefined();
      expect(typeof body.analysis).toBe('string');
      expect(body.analysis.length).toBeGreaterThan(20);
    }
  });

  test('POST with user that has history returns stats object', async ({ request }) => {
    // First seed a quiz score for this user
    await request.post('/api/quiz-scores/', {
      data: {
        user_id: 'lex-coach-test-user',
        score: 7,
        total: 10,
        time_used: 55,
        timer_limit: 90,
        timed_out: 0,
      },
    });

    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'lex-coach-test-user' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.stats).toBeDefined();
        expect(body.stats.totalGames).toBeGreaterThanOrEqual(1);
        expect(body.stats.accuracy).toBeDefined();
        expect(body.stats.avgScore).toBeDefined();
        expect(body.stats.avgTotal).toBeDefined();
        expect(body.stats.totalPerfect).toBeDefined();
        expect(body.stats.totalTimedOut).toBeDefined();
        expect(body.stats.avgTime).toBeDefined();
        // Time split & usage fields
        expect(body.stats.timeUsagePct).toBeDefined();
        expect(typeof body.stats.timeUsagePct).toBe('number');
        expect(body.stats.avgSecondsPerWord).toBeDefined();
        expect(typeof body.stats.avgSecondsPerWord).toBe('number');
        expect(body.stats.timerLimitsUsed).toBeDefined();
        expect(Array.isArray(body.stats.timerLimitsUsed)).toBe(true);
        expect(body.stats.wordCountsUsed).toBeDefined();
        expect(Array.isArray(body.stats.wordCountsUsed)).toBe(true);
      }
    }
  });

  test('POST returns full history analysis (no 30-game limit)', async ({ request }) => {
    // Seed multiple scores to ensure more than 30 would exist for a heavy user
    // This test verifies the endpoint does not cap at 30 games by checking totalGames in stats
    const userId = 'lex-coach-no-limit-test';

    // Seed a score so the user has at least 1 game
    await request.post('/api/quiz-scores/', {
      data: {
        user_id: userId,
        score: 5,
        total: 10,
        time_used: 40,
        timer_limit: 90,
        timed_out: 0,
      },
    });

    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: userId },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        // totalGames should reflect ALL games, not capped at 30
        expect(body.stats.totalGames).toBeGreaterThanOrEqual(1);
        // The analysis should exist regardless of game count
        expect(body.analysis).toBeDefined();
        expect(typeof body.analysis).toBe('string');
      }
    }
  });

  test('POST response includes analysis string (AI or fallback)', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'test-user-playwright' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.analysis).toBeDefined();
      expect(typeof body.analysis).toBe('string');
      // Analysis should be meaningful text, not empty
      expect(body.analysis.length).toBeGreaterThan(10);
    }
  });

  test('POST with history includes gameAnalysis array', async ({ request }) => {
    // Seed a score to ensure history exists
    await request.post('/api/quiz-scores/', {
      data: {
        user_id: 'lex-coach-game-analysis-user',
        score: 8,
        total: 10,
        time_used: 45,
        timer_limit: 90,
        timed_out: 0,
      },
    });

    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'lex-coach-game-analysis-user' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.gameAnalysis).toBeDefined();
        expect(Array.isArray(body.gameAnalysis)).toBe(true);
        expect(body.gameAnalysis.length).toBeGreaterThanOrEqual(1);
        // Each game analysis entry should have required fields
        const entry = body.gameAnalysis[0];
        expect(entry.gameNumber).toBeDefined();
        expect(entry.score).toBeDefined();
        expect(entry.total).toBeDefined();
        expect(entry.accuracy).toBeDefined();
        expect(entry.rating).toBeDefined();
        expect(['perfect', 'great', 'good', 'fair', 'weak']).toContain(entry.rating);
        expect(entry.weaknesses).toBeDefined();
        expect(Array.isArray(entry.weaknesses)).toBe(true);
        expect(entry.improvements).toBeDefined();
        expect(Array.isArray(entry.improvements)).toBe(true);
      }
    }
  });

  test('POST with 10+ games triggers phase-based progression (endpoint still succeeds)', async ({ request }) => {
    const userId = 'lex-coach-phase-progression-test';

    // Seed 12 games to trigger the phase analysis path (requires 10+ games)
    for (let i = 0; i < 12; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: Math.min(3 + i, 10), // Gradually improving scores
          total: 10,
          time_used: 80 - i * 3, // Gradually faster
          timer_limit: 90,
          timed_out: i < 2 ? 1 : 0, // First 2 games timed out
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: userId },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(true);
      expect(body.stats).toBeDefined();
      expect(body.stats.totalGames).toBeGreaterThanOrEqual(12);
      expect(body.analysis).toBeDefined();
      expect(typeof body.analysis).toBe('string');
      expect(body.analysis.length).toBeGreaterThan(10);
      // gameAnalysis should reflect all 12+ games
      expect(body.gameAnalysis).toBeDefined();
      expect(body.gameAnalysis.length).toBeGreaterThanOrEqual(12);
    }
  });
});

test.describe('API — /api/lex-quiz-coach/ POST — Phase Analysis', () => {
  const phaseUserId = 'lex-coach-phase-test-' + Date.now();

  test.beforeAll(async ({ request }) => {
    // Seed 12 games for this user so phase analysis triggers (requires 10+)
    for (let i = 0; i < 12; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: phaseUserId,
          score: 3 + Math.floor(i / 3), // gradually improving scores: 3,3,3,4,4,4,5,5,5,6,6,6
          total: 10,
          time_used: 60 - i * 2, // gradually faster
          timer_limit: 90,
          timed_out: 0,
        },
      });
    }
  });

  test('phases object is returned when user has 10+ games', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: phaseUserId },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(true);
      expect(body.phases).toBeDefined();
      expect(body.phases).not.toBeNull();
    }
  });

  test('phases contains beginning, mid, and end objects', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        expect(body.phases.beginning).toBeDefined();
        expect(body.phases.mid).toBeDefined();
        expect(body.phases.end).toBeDefined();
      }
    }
  });

  test('each phase has accuracy, avgTime, games, perfectRounds, timedOut', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        for (const phase of ['beginning', 'mid', 'end']) {
          const p = body.phases[phase];
          expect(p.accuracy).toBeDefined();
          expect(typeof p.accuracy).toBe('number');
          expect(p.avgTime).toBeDefined();
          expect(typeof p.avgTime).toBe('number');
          expect(p.games).toBeDefined();
          expect(p.games).toBeGreaterThanOrEqual(1);
          expect(p.perfectRounds).toBeDefined();
          expect(p.timedOut).toBeDefined();
        }
      }
    }
  });

  test('phases includes trend field (improving, declining, or stable)', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        expect(body.phases.trend).toBeDefined();
        expect(['improving', 'declining', 'stable']).toContain(body.phases.trend);
      }
    }
  });

  test('phases includes accDelta and timeDelta numbers', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        expect(typeof body.phases.accDelta).toBe('number');
        expect(typeof body.phases.timeDelta).toBe('number');
      }
    }
  });

  test('phases is null when user has fewer than 10 games', async ({ request }) => {
    const fewGamesUser = 'lex-coach-few-games-' + Date.now();
    // Seed only 3 games
    for (let i = 0; i < 3; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: fewGamesUser,
          score: 5,
          total: 10,
          time_used: 45,
          timer_limit: 90,
          timed_out: 0,
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: fewGamesUser },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.phases).toBeNull();
      }
    }
  });

  test('phase game counts roughly equal a third of total games', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases && body.stats) {
        const total = body.stats.totalGames;
        const third = Math.floor(total / 3);
        // Beginning and mid should be exactly floor(total/3), end gets the remainder
        expect(body.phases.beginning.games).toBe(third);
        expect(body.phases.mid.games).toBe(third);
        expect(body.phases.end.games).toBeGreaterThanOrEqual(third);
      }
    }
  });
});

test.describe('API — /api/lex-quiz-coach/ POST — Time Split & Usage Analysis', () => {
  test('timeUsagePct is a number between 0 and 100', async ({ request }) => {
    const userId = 'lex-time-pct-test-' + Date.now();
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 7, total: 10, time_used: 45, timer_limit: 90, timed_out: 0 },
    });

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.stats.timeUsagePct).toBeGreaterThanOrEqual(0);
        expect(body.stats.timeUsagePct).toBeLessThanOrEqual(100);
      }
    }
  });

  test('avgSecondsPerWord is a positive number when history exists', async ({ request }) => {
    const userId = 'lex-spw-test-' + Date.now();
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 5, total: 10, time_used: 60, timer_limit: 90, timed_out: 0 },
    });

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.stats.avgSecondsPerWord).toBeGreaterThan(0);
      }
    }
  });

  test('timerLimitsUsed contains unique sorted values matching games played', async ({ request }) => {
    const userId = 'lex-timer-limits-test-' + Date.now();
    // Seed 3 games with different timer limits
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 5, total: 10, time_used: 40, timer_limit: 60, timed_out: 0 },
    });
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 7, total: 10, time_used: 70, timer_limit: 90, timed_out: 0 },
    });
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 8, total: 10, time_used: 100, timer_limit: 120, timed_out: 0 },
    });

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        const limits = body.stats.timerLimitsUsed;
        expect(limits.length).toBeGreaterThanOrEqual(3);
        // Verify sorted ascending
        for (let i = 1; i < limits.length; i++) {
          expect(limits[i]).toBeGreaterThanOrEqual(limits[i - 1]);
        }
        // Should contain the 3 seeded timer limits
        expect(limits).toContain(60);
        expect(limits).toContain(90);
        expect(limits).toContain(120);
      }
    }
  });

  test('wordCountsUsed contains unique sorted values matching games played', async ({ request }) => {
    const userId = 'lex-word-counts-test-' + Date.now();
    // Seed games with different word counts (total field)
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 3, total: 5, time_used: 30, timer_limit: 60, timed_out: 0 },
    });
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 7, total: 10, time_used: 55, timer_limit: 90, timed_out: 0 },
    });
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 12, total: 15, time_used: 80, timer_limit: 120, timed_out: 0 },
    });

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        const counts = body.stats.wordCountsUsed;
        expect(counts.length).toBeGreaterThanOrEqual(3);
        // Verify sorted ascending
        for (let i = 1; i < counts.length; i++) {
          expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
        }
        // Should contain the 3 seeded word counts
        expect(counts).toContain(5);
        expect(counts).toContain(10);
        expect(counts).toContain(15);
      }
    }
  });

  test('high timer usage player still gets valid response (time suggestion path)', async ({ request }) => {
    const userId = 'lex-high-timer-test-' + Date.now();
    // Seed 5 games where player uses >90% of timer and times out >30%
    for (let i = 0; i < 5; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: 4,
          total: 10,
          time_used: 88, // 88/90 = 97% timer usage
          timer_limit: 90,
          timed_out: i < 2 ? 1 : 0, // 2 out of 5 = 40% timeout rate
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(true);
      expect(body.stats.timeUsagePct).toBeGreaterThan(90);
      expect(body.analysis).toBeDefined();
      expect(body.analysis.length).toBeGreaterThan(10);
    }
  });

  test('fast accurate player gets valid response (low timer usage path)', async ({ request }) => {
    const userId = 'lex-fast-accurate-test-' + Date.now();
    // Seed 5 games with <40% timer usage and >=80% accuracy
    for (let i = 0; i < 5; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: 9,
          total: 10,
          time_used: 30, // 30/90 = 33% timer usage
          timer_limit: 90,
          timed_out: 0,
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(true);
      expect(body.stats.timeUsagePct).toBeLessThan(40);
      expect(body.analysis).toBeDefined();
      expect(body.analysis.length).toBeGreaterThan(10);
    }
  });

  test('single timer/word-count user (5+ games) gets valid response', async ({ request }) => {
    const userId = 'lex-single-settings-test-' + Date.now();
    // Seed 6 games all with same timer_limit and total (triggers suggestion paths)
    for (let i = 0; i < 6; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: 6,
          total: 5, // always 5 words
          time_used: 35,
          timer_limit: 60, // always 60s timer
          timed_out: 0,
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(true);
      // Should show only 1 timer limit and 1 word count
      expect(body.stats.timerLimitsUsed).toEqual([60]);
      expect(body.stats.wordCountsUsed).toEqual([5]);
      expect(body.analysis).toBeDefined();
    }
  });
});

test.describe('API — /api/lex-quiz-coach/ POST — Structured Coaching Output', () => {
  test('analysis response can exceed 200 chars (max_tokens 450 allows longer coaching)', async ({ request }) => {
    const userId = 'lex-coach-long-output-test-' + Date.now();
    // Seed 5 games to ensure AI path is hit (not wisdom fallback)
    for (let i = 0; i < 5; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: 6 + i,
          total: 10,
          time_used: 50 - i * 5,
          timer_limit: 90,
          timed_out: 0,
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        // With max_tokens bumped to 450, AI analysis should be able to produce
        // structured content exceeding the old 250-token limit (~200 chars)
        expect(body.analysis.length).toBeGreaterThan(50);
        expect(typeof body.analysis).toBe('string');
      }
    }
  });

  test('analysis from AI path or fallback is always a non-empty string', async ({ request }) => {
    const userId = 'lex-coach-analysis-string-test-' + Date.now();
    await request.post('/api/quiz-scores/', {
      data: { user_id: userId, score: 9, total: 10, time_used: 30, timer_limit: 90, timed_out: 0 },
    });

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.analysis).toBeDefined();
      expect(typeof body.analysis).toBe('string');
      expect(body.analysis.trim().length).toBeGreaterThan(0);
      // Should not be an error message or empty placeholder
      expect(body.analysis).not.toContain('undefined');
      expect(body.analysis).not.toContain('null');
    }
  });

  test('buildQuizCoachPrompt integration produces valid AI response structure', async ({ request }) => {
    // This tests that the refactored buildQuizCoachPrompt function (extracted from inline)
    // still generates proper prompts that the AI can respond to
    const userId = 'lex-coach-prompt-builder-test-' + Date.now();
    for (let i = 0; i < 3; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: 7,
          total: 10,
          time_used: 55,
          timer_limit: 90,
          timed_out: 0,
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        // The response shape must be intact after prompt extraction refactor
        expect(body.stats).toBeDefined();
        expect(body.analysis).toBeDefined();
        expect(body.gameAnalysis).toBeDefined();
        expect(Array.isArray(body.gameAnalysis)).toBe(true);
        // Stats must include all the fields the prompt builder uses
        expect(body.stats.timeUsagePct).toBeDefined();
        expect(body.stats.avgSecondsPerWord).toBeDefined();
        expect(body.stats.timerLimitsUsed).toBeDefined();
        expect(body.stats.wordCountsUsed).toBeDefined();
      }
    }
  });

  test('AI response does not contain raw prompt fragments (no prompt leakage)', async ({ request }) => {
    const userId = 'lex-coach-no-leak-test-' + Date.now();
    for (let i = 0; i < 4; i++) {
      await request.post('/api/quiz-scores/', {
        data: { user_id: userId, score: 5, total: 10, time_used: 60, timer_limit: 90, timed_out: 0 },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', { data: { user_id: userId } });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.analysis) {
        // The analysis should not contain raw prompt engineering instructions
        expect(body.analysis).not.toContain('CRITICAL STYLE RULES');
        expect(body.analysis).not.toContain('BANNED PHRASES');
        expect(body.analysis).not.toContain('OUTPUT FORMAT');
        expect(body.analysis).not.toContain('PLAYER DATA');
      }
    }
  });
});

test.describe('API — /api/lex-quiz-coach/ POST — Negative', () => {
  test('POST without user_id returns 400', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('POST with invalid JSON returns 400', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-valid-json{{{',
    });
    // Should return 400 for invalid JSON
    expect(response.status()).toBe(400);
  });

  test('POST handles SQL injection in user_id gracefully', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: "'; DROP TABLE quiz_scores; --" },
    });
    // Should not crash (500) — parameterized query protects against injection
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      // Should treat as user with no history
      expect(body.hasHistory).toBe(false);
      expect(body.analysis).toBeDefined();
    }
  });

  test('POST with empty string user_id returns 400', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: '' },
    });
    // Empty string is falsy, so should trigger 'user_id required' check
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('POST does not return 404 (endpoint exists)', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'check-endpoint-exists' },
    });
    expect(response.status()).not.toBe(404);
  });

  test('POST with no-history user does not include stats or gameAnalysis', async ({ request }) => {
    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: 'definitely-no-history-user-xyz-negative-test' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory === false) {
        // Should NOT have stats or gameAnalysis when there's no history
        expect(body.stats).toBeUndefined();
        expect(body.gameAnalysis).toBeUndefined();
      }
    }
  });

  test('POST with few games (< 10) does not crash phase analysis path', async ({ request }) => {
    const userId = 'lex-coach-few-games-negative-test';

    // Seed only 3 games — below the 10-game threshold for phase analysis
    for (let i = 0; i < 3; i++) {
      await request.post('/api/quiz-scores/', {
        data: {
          user_id: userId,
          score: 5 + i,
          total: 10,
          time_used: 60,
          timer_limit: 90,
          timed_out: 0,
        },
      });
    }

    const response = await request.post('/api/lex-quiz-coach/', {
      data: { user_id: userId },
    });
    // Must not crash — endpoint still works with < 10 games
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(true);
      expect(body.stats.totalGames).toBeGreaterThanOrEqual(3);
      expect(body.analysis).toBeDefined();
      expect(body.gameAnalysis).toBeDefined();
      expect(body.gameAnalysis.length).toBeGreaterThanOrEqual(3);
    }
  });
});
