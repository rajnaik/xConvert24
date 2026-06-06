import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/coins?uid=xxx — get user's coin balance and stats
 * POST /api/coins — earn coins for an activity
 *   Body: { uid: string, activity: string }
 */

const REWARDS: Record<string, number> = {
  'first_conversion': 5,
  'daily_visit': 5,
  'multi_converter': 10,
  'streak_7': 50,
  'streak_30': 200,
  'share': 5,
  'bug_report': 25,
  'bug_validated': 25,
  'suggestion': 25,
  'vote_bug': 3,
  'vote_suggestion': 3,
  'vote_10_milestone': 10,
  'opinion_vote': 15,
  'crypto_watchlist': 20,
  'crypto_use': 5,
  'cooking_convert': 5,
  'finance_use': 5,
  'fashion_convert': 5,
  'bookmark_page': 5,
  'add_favourite': 3,
  'favourite_5': 10,
  'publish_favourites': 10,
  'quiz_correct': 10,
  'home_screen': 100,
  'blog_read': 5,
  'refer': 20,
  'dark_mode': 5,
  'use_search': 5,
  'share_page': 5,
};

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) return new Response(JSON.stringify({ coins: 0, streak: 0, level: 1 }), { headers: { 'Content-Type': 'application/json' } });

  const uid = url.searchParams.get('uid');
  if (!uid) return new Response(JSON.stringify({ coins: 0, streak: 0, level: 1 }), { headers: { 'Content-Type': 'application/json' } });

  const user = await db.prepare('SELECT * FROM user_coins WHERE id = ?').bind(uid).first();
  if (!user) return new Response(JSON.stringify({ coins: 0, streak: 0, level: 1, total_earned: 0 }), { headers: { 'Content-Type': 'application/json' } });

  return new Response(JSON.stringify(user), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { uid, activity } = body;
  if (!uid || !activity) return new Response(JSON.stringify({ error: 'uid and activity required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const reward = REWARDS[activity];
  if (!reward) return new Response(JSON.stringify({ error: 'Unknown activity' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  // Ensure user exists
  const existing = await db.prepare('SELECT * FROM user_coins WHERE id = ?').bind(uid).first();
  const today = new Date().toISOString().split('T')[0];

  if (!existing) {
    await db.prepare('INSERT INTO user_coins (id, coins, streak, level, last_active, total_earned) VALUES (?, ?, 1, 1, ?, ?)').bind(uid, reward, today, reward).run();
  } else {
    // Calculate streak
    let streak = existing.streak || 0;
    const lastActive = existing.last_active || '';
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastActive === yesterday) streak += 1;
    else if (lastActive !== today) streak = 1;

    // Calculate level based on new metal tiers
    const newTotal = (existing.total_earned || 0) + reward;
    const LEVEL_THRESHOLDS = [0, 1000, 5000, 50000, 100000, 250000, 500000, 2000000, 5000000, 10000000, 50000000, 1000000000];
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (newTotal >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
    }

    await db.prepare('UPDATE user_coins SET coins = coins + ?, streak = ?, level = ?, last_active = ?, total_earned = ? WHERE id = ?')
      .bind(reward, streak, level, today, newTotal, uid).run();
  }

  // Log event
  await db.prepare('INSERT INTO coin_events (user_id, activity, coins) VALUES (?, ?, ?)').bind(uid, activity, reward).run();

  // Return updated balance
  const updated = await db.prepare('SELECT * FROM user_coins WHERE id = ?').bind(uid).first();

  return new Response(JSON.stringify({ success: true, earned: reward, activity, ...updated }), {
    status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
