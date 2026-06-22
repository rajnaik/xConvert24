import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Admin API — User Detail
 * GET /api/users/:id — returns full activity timeline for a single user
 */

export const GET: APIRoute = async ({ params }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const userId = params.id;
  if (!userId) return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });

  try {
    // 1. Rewards summary
    const rewardResult = await db.prepare(
      `SELECT total_stars, total_diamonds, current_streak, best_streak,
              diamond_streak, best_diamond_streak, last_active_date, last_diamond_date, created_at, updated_at
       FROM user_rewards WHERE user_id = ?`
    ).bind(userId).first();

    // 2. Recent clicks (last 20)
    const clicksResult = await db.prepare(
      `SELECT ui_element, url, created_at FROM clicks
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // 3. Quiz scores (last 20)
    const quizResult = await db.prepare(
      `SELECT score, total, time_used, timer_limit, timed_out, created_at FROM quiz_scores
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // 4. Daily anagram scores (last 20)
    const anagramResult = await db.prepare(
      `SELECT date, attempts, solved, time_taken, created_at FROM daily_anagram_scores
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // 5. Daily rack scores (last 20)
    const rackResult = await db.prepare(
      `SELECT date, word, score, created_at FROM daily_rack_scores
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // 6. CaB scores (last 20)
    const cabResult = await db.prepare(
      `SELECT wordId, solved, attempts, split_time, timer_duration, startDatetime as created_at FROM CaB_Scores
       WHERE user_id = ? ORDER BY startDatetime DESC LIMIT 20`
    ).bind(userId).all();

    // 7. Solver history (last 20) — rack_history stores submitted words
    const solverResult = await db.prepare(
      `SELECT word, score, meaning, submitted_at as created_at FROM rack_history
       WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 20`
    ).bind(userId).all();

    // 8. Wordbench practice (last 20)
    const practiceResult = await db.prepare(
      `SELECT word, meaning, created_at FROM wordbench_practice
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(userId).all();

    // 9. Bonus diamonds
    const bonusResult = await db.prepare(
      `SELECT bonus_type, awarded_at as created_at FROM bonus_diamonds
       WHERE user_id = ? ORDER BY awarded_at DESC LIMIT 20`
    ).bind(userId).all();

    return new Response(JSON.stringify({
      user_id: userId,
      rewards: rewardResult || null,
      clicks: clicksResult.results || [],
      quizzes: quizResult.results || [],
      anagrams: anagramResult.results || [],
      racks: rackResult.results || [],
      cab_games: cabResult.results || [],
      solver_history: solverResult.results || [],
      practice: practiceResult.results || [],
      bonus_diamonds: bonusResult.results || [],
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
};
