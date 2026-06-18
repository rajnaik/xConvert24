import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/anagram-history?user_id=xxx — fetch user's Daily Anagram history
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
  }

  // Count-only mode for conditional history icon display
  const countOnly = url.searchParams.get('count');
  if (countOnly === 'true') {
    const row = await db.prepare(
      'SELECT COUNT(*) as total FROM daily_anagram_scores WHERE user_id = ?'
    ).bind(userId).first();
    return new Response(JSON.stringify({ count: row?.total || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch user's history ordered by date desc, limited to last 100
  const result = await db.prepare(
    'SELECT date, attempts, solved, guesses, time_taken, created_at FROM daily_anagram_scores WHERE user_id = ? ORDER BY date DESC LIMIT 100'
  ).bind(userId).all();

  const scores = result.results as any[];

  // Fetch the puzzle words for solved entries (so we can show what the answer was)
  const dates = scores.map((s: any) => s.date);
  let puzzles: Record<string, { word: string; scrambled: string; hint: string }> = {};
  if (dates.length > 0) {
    const placeholders = dates.map(() => '?').join(',');
    const puzzleRows = await db.prepare(
      `SELECT date, word, scrambled, hint FROM daily_anagram WHERE date IN (${placeholders})`
    ).bind(...dates).all();
    for (const row of puzzleRows.results as any[]) {
      puzzles[row.date] = { word: row.word, scrambled: row.scrambled, hint: row.hint };
    }
  }

  // Compute summary stats
  const totalGames = scores.length;
  const totalSolved = scores.filter((s: any) => s.solved === 1).length;
  const avgAttempts = totalGames > 0
    ? Math.round((scores.reduce((sum: number, s: any) => sum + s.attempts, 0) / totalGames) * 10) / 10
    : 0;

  // Current streak (consecutive solved days from most recent)
  let streak = 0;
  for (const s of scores) {
    if (s.solved === 1) streak++;
    else break;
  }

  return new Response(JSON.stringify({
    history: scores,
    puzzles,
    stats: {
      totalGames,
      totalSolved,
      avgAttempts,
      streak,
      solveRate: totalGames > 0 ? Math.round((totalSolved / totalGames) * 100) : 0,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
