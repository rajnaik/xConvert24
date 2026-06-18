import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Bonus Diamond API
 *
 * GET  /api/bonus-diamond?user_id=X — check if user has already earned a specific bonus
 * POST /api/bonus-diamond — award a one-time bonus diamond { user_id, bonus_type }
 *
 * bonus_type values: "backup" (earned by downloading a full data backup)
 */

const VALID_BONUS_TYPES = ['backup'];

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const bonusType = url.searchParams.get('bonus_type');

  if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
  if (!bonusType) return new Response(JSON.stringify({ error: 'bonus_type required' }), { status: 400 });

  const row = await db.prepare(
    'SELECT id, awarded_at FROM bonus_diamonds WHERE user_id = ? AND bonus_type = ?'
  ).bind(userId, bonusType).first();

  return new Response(JSON.stringify({
    earned: !!row,
    awarded_at: row ? (row as any).awarded_at : null,
  }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { user_id, bonus_type } = body;

  if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
  if (!bonus_type) return new Response(JSON.stringify({ error: 'bonus_type required' }), { status: 400 });
  if (!VALID_BONUS_TYPES.includes(bonus_type)) {
    return new Response(JSON.stringify({ error: 'Invalid bonus_type. Valid: ' + VALID_BONUS_TYPES.join(', ') }), { status: 400 });
  }

  // Check if already earned (idempotent — don't award twice)
  const existing = await db.prepare(
    'SELECT id FROM bonus_diamonds WHERE user_id = ? AND bonus_type = ?'
  ).bind(user_id, bonus_type).first();

  if (existing) {
    return new Response(JSON.stringify({
      awarded: false,
      already_earned: true,
      message: 'Bonus diamond already earned for: ' + bonus_type,
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Award the bonus diamond
  await db.prepare(
    'INSERT INTO bonus_diamonds (user_id, bonus_type) VALUES (?, ?)'
  ).bind(user_id, bonus_type).run();

  // Also increment total_diamonds in user_rewards
  const rewards = await db.prepare(
    'SELECT id FROM user_rewards WHERE user_id = ?'
  ).bind(user_id).first();

  if (rewards) {
    await db.prepare(
      "UPDATE user_rewards SET total_diamonds = total_diamonds + 1, updated_at = datetime('now') WHERE user_id = ?"
    ).bind(user_id).run();
  } else {
    await db.prepare(
      'INSERT INTO user_rewards (user_id, total_stars, total_diamonds, current_streak, best_streak, diamond_streak, best_diamond_streak, last_active_date, last_diamond_date) VALUES (?, 0, 1, 0, 0, 0, 0, ?, ?)'
    ).bind(user_id, new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]).run();
  }

  return new Response(JSON.stringify({
    awarded: true,
    bonus_type,
    message: '💎 Bonus diamond earned for backing up your data!',
  }), { headers: { 'Content-Type': 'application/json' } });
};
