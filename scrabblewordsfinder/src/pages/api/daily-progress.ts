import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Stars & Diamonds API (scalable — games from star_games table)
 * 
 * GET /api/daily-progress?user_id=X — today's stars + lifetime + registered games
 * POST /api/daily-progress — award a star { user_id, game: slug }
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

  const today = new Date().toISOString().split('T')[0];

  // Get registered games
  const gamesResult = await db.prepare('SELECT id, slug, name, icon, description, star_action, color, sort_order FROM activities WHERE active = 1 ORDER BY sort_order').all();
  const games = gamesResult.results || [];

  // Get today's progress
  let todayRow = await db.prepare(
    'SELECT * FROM daily_progress WHERE user_id = ? AND date = ?'
  ).bind(userId, today).first() as any;

  const starsEarned: string[] = todayRow ? JSON.parse(todayRow.stars_earned || '[]') : [];

  // Get lifetime stats
  let rewards = await db.prepare('SELECT * FROM user_rewards WHERE user_id = ?').bind(userId).first() as any;
  if (!rewards) rewards = { total_stars: 0, total_diamonds: 0, current_streak: 0, best_streak: 0, diamond_streak: 0, best_diamond_streak: 0, theme_unlocked: '[]', perks_unlocked: '[]' };

  // Count lost diamonds (days with all stars earned but diamond not claimed, in the past)
  const lostResult = await db.prepare(
    'SELECT COUNT(*) as count FROM daily_progress WHERE user_id = ? AND date < ? AND stars_total >= (SELECT COUNT(*) FROM activities WHERE active = 1) AND diamond = 0'
  ).bind(userId, today).first() as any;
  const diamondsLost = lostResult?.count || 0;

  // Near misses: days where user was 1 star away from diamond (stars_total = threshold - 1)
  const nearMissResult = await db.prepare(
    'SELECT COUNT(*) as count FROM daily_progress WHERE user_id = ? AND date < ? AND stars_total = (SELECT COUNT(*) FROM activities WHERE active = 1) - 1 AND diamond = 0'
  ).bind(userId, today).first() as any;
  const nearMisses = nearMissResult?.count || 0;

  // Average stars per day (last 7 days)
  const weekAgoDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const weekResult = await db.prepare(
    'SELECT COALESCE(ROUND(AVG(stars_total * 1.0), 1), 0) as avg FROM daily_progress WHERE user_id = ? AND date >= ?'
  ).bind(userId, weekAgoDate).first() as any;
  const avgWeek = weekResult?.avg || 0;

  // Average stars per day (last 30 days)
  const monthAgoDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const monthResult = await db.prepare(
    'SELECT COALESCE(ROUND(AVG(stars_total * 1.0), 1), 0) as avg FROM daily_progress WHERE user_id = ? AND date >= ?'
  ).bind(userId, monthAgoDate).first() as any;
  const avgMonth = monthResult?.avg || 0;

  return new Response(JSON.stringify({
    games,
    diamond_threshold: games.length,
    today: {
      date: today,
      stars_earned: starsEarned,
      stars_total: starsEarned.length,
      diamond: todayRow?.diamond || 0,
    },
    lifetime: {
      total_stars: rewards.total_stars,
      total_diamonds: rewards.total_diamonds,
      diamonds_lost: diamondsLost,
      near_misses: nearMisses,
      avg_stars_week: avgWeek,
      avg_stars_month: avgMonth,
      current_streak: rewards.current_streak,
      best_streak: rewards.best_streak,
      diamond_streak: rewards.diamond_streak,
      best_diamond_streak: rewards.best_diamond_streak,
      themes: JSON.parse(rewards.theme_unlocked || '[]'),
      perks: JSON.parse(rewards.perks_unlocked || '[]'),
    },
  }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, game } = body;

  if (!user_id || !game) return new Response(JSON.stringify({ error: 'user_id and game required' }), { status: 400 });

  // Validate game exists in registry
  const gameRow = await db.prepare('SELECT id, slug FROM activities WHERE slug = ? AND active = 1').bind(game).first() as any;
  if (!gameRow) return new Response(JSON.stringify({ error: 'Unknown or inactive game: ' + game }), { status: 400 });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Get or create today's row
  let todayRow = await db.prepare(
    'SELECT * FROM daily_progress WHERE user_id = ? AND date = ?'
  ).bind(user_id, today).first() as any;

  let starsEarned: string[] = todayRow ? JSON.parse(todayRow.stars_earned || '[]') : [];

  // Check if already earned
  if (starsEarned.includes(game)) {
    const rewards = await db.prepare('SELECT * FROM user_rewards WHERE user_id = ?').bind(user_id).first() as any;
    return new Response(JSON.stringify({
      star_awarded: game,
      already_earned: true,
      today: { stars_earned: starsEarned, stars_total: starsEarned.length, diamond: todayRow?.diamond || 0 },
      lifetime: { total_stars: rewards?.total_stars || 0, total_diamonds: rewards?.total_diamonds || 0, current_streak: rewards?.current_streak || 0, diamond_streak: rewards?.diamond_streak || 0 },
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Add star
  starsEarned.push(game);
  const starsJson = JSON.stringify(starsEarned);

  // Get diamond threshold (number of active activities)
  const thresholdRow = await db.prepare('SELECT COUNT(*) as count FROM activities WHERE active = 1').first() as any;
  const threshold = thresholdRow?.count || 6;
  const earnedDiamond = starsEarned.length >= threshold;

  if (todayRow) {
    await db.prepare(
      "UPDATE daily_progress SET stars_earned = ?, stars_total = ?, diamond = ?, updated_at = datetime('now') WHERE user_id = ? AND date = ?"
    ).bind(starsJson, starsEarned.length, earnedDiamond ? 1 : todayRow.diamond, user_id, today).run();
  } else {
    // Use INSERT OR IGNORE + UPDATE to handle race conditions (concurrent star awards)
    await db.prepare(
      'INSERT OR IGNORE INTO daily_progress (user_id, date, stars_earned, stars_total, diamond) VALUES (?, ?, ?, ?, ?)'
    ).bind(user_id, today, starsJson, starsEarned.length, earnedDiamond ? 1 : 0).run();
    // If IGNORE fired (row already exists from a concurrent request), update it
    await db.prepare(
      "UPDATE daily_progress SET stars_earned = ?, stars_total = ?, diamond = CASE WHEN diamond = 1 THEN 1 ELSE ? END, updated_at = datetime('now') WHERE user_id = ? AND date = ?"
    ).bind(starsJson, starsEarned.length, earnedDiamond ? 1 : 0, user_id, today).run();
  }

  // Update user_rewards
  const existing = await db.prepare('SELECT * FROM user_rewards WHERE user_id = ?').bind(user_id).first() as any;

  if (!existing) {
    const diamondStreak = earnedDiamond ? 1 : 0;
    await db.prepare(
      'INSERT INTO user_rewards (user_id, total_stars, total_diamonds, current_streak, best_streak, diamond_streak, best_diamond_streak, last_active_date, last_diamond_date) VALUES (?, 1, ?, 1, 1, ?, ?, ?, ?)'
    ).bind(user_id, earnedDiamond ? 1 : 0, diamondStreak, diamondStreak, today, earnedDiamond ? today : '').run();
  } else {
    let newStreak = existing.current_streak;
    if (existing.last_active_date === yesterday) newStreak = existing.current_streak + 1;
    else if (existing.last_active_date !== today) newStreak = 1;
    const bestStreak = Math.max(newStreak, existing.best_streak);

    let diamondStreak = existing.diamond_streak;
    if (earnedDiamond) {
      if (existing.last_diamond_date === yesterday) diamondStreak = existing.diamond_streak + 1;
      else if (existing.last_diamond_date !== today) diamondStreak = 1;
    }
    const bestDiamondStreak = Math.max(diamondStreak, existing.best_diamond_streak);

    await db.prepare(
      "UPDATE user_rewards SET total_stars = total_stars + 1, total_diamonds = total_diamonds + ?, current_streak = ?, best_streak = ?, diamond_streak = ?, best_diamond_streak = ?, last_active_date = ?, last_diamond_date = CASE WHEN ? = 1 THEN ? ELSE last_diamond_date END, updated_at = datetime('now') WHERE user_id = ?"
    ).bind(earnedDiamond ? 1 : 0, newStreak, bestStreak, diamondStreak, bestDiamondStreak, today, earnedDiamond ? 1 : 0, today, user_id).run();
  }

  const updatedRewards = await db.prepare('SELECT * FROM user_rewards WHERE user_id = ?').bind(user_id).first() as any;

  return new Response(JSON.stringify({
    star_awarded: game,
    diamond_earned: earnedDiamond,
    today: { stars_earned: starsEarned, stars_total: starsEarned.length, diamond: earnedDiamond ? 1 : (todayRow?.diamond || 0) },
    lifetime: { total_stars: updatedRewards?.total_stars || 0, total_diamonds: updatedRewards?.total_diamonds || 0, current_streak: updatedRewards?.current_streak || 0, diamond_streak: updatedRewards?.diamond_streak || 0 },
  }), { headers: { 'Content-Type': 'application/json' } });
};
