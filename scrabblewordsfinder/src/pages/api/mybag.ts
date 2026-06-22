import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * MyBag API — star/diamond earning history for a user
 * 
 * GET /api/mybag?user_id=X — returns earning history + totals
 * Optional: ?limit=30 (default 30, max 90)
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '30', 10) || 30, 1), 90);

  // Get lifetime totals from user_rewards
  const rewards = await db.prepare(
    'SELECT total_stars, total_diamonds, current_streak, best_streak, diamond_streak, best_diamond_streak, last_active_date FROM user_rewards WHERE user_id = ?'
  ).bind(userId).first() as any;

  // Get earning history from daily_progress (most recent first)
  const historyResult = await db.prepare(
    'SELECT date, stars_earned, stars_total, diamond FROM daily_progress WHERE user_id = ? ORDER BY date DESC LIMIT ?'
  ).bind(userId, limit).all();

  const history = (historyResult.results || []).map((row: any) => {
    const starsEarned: string[] = JSON.parse(row.stars_earned || '[]');
    return {
      date: row.date,
      stars: starsEarned,
      stars_count: row.stars_total,
      diamond: row.diamond === 1,
    };
  });

  // Get activity registry for name/icon lookup
  const activitiesResult = await db.prepare(
    'SELECT slug, name, icon, color FROM activities ORDER BY sort_order'
  ).all();
  const activities = (activitiesResult.results || []).reduce((map: any, a: any) => {
    map[a.slug] = { name: a.name, icon: a.icon, color: a.color };
    return map;
  }, {} as Record<string, { name: string; icon: string; color: string }>);

  return new Response(JSON.stringify({
    totals: {
      total_stars: rewards?.total_stars || 0,
      total_diamonds: rewards?.total_diamonds || 0,
      current_streak: rewards?.current_streak || 0,
      best_streak: rewards?.best_streak || 0,
      diamond_streak: rewards?.diamond_streak || 0,
      best_diamond_streak: rewards?.best_diamond_streak || 0,
      last_active_date: rewards?.last_active_date || '',
    },
    activities,
    history,
  }), { headers: { 'Content-Type': 'application/json' } });
};
