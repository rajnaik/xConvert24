import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Stars & Diamonds Admin API
 * GET /api/stars-and-diamonds/ — returns all users' reward data + summary stats
 */

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  // Get all user rewards
  const result = await db.prepare(
    'SELECT user_id, total_stars, total_diamonds, current_streak, best_streak, diamond_streak, best_diamond_streak, last_active_date, created_at FROM user_rewards ORDER BY total_stars DESC LIMIT 200'
  ).all();

  // Get bonus diamond counts per user
  const bonusResult = await db.prepare(
    'SELECT user_id, COUNT(*) as bonus_count FROM bonus_diamonds GROUP BY user_id'
  ).all();
  const bonusMap: Record<string, number> = {};
  for (const row of (bonusResult.results || []) as any[]) {
    bonusMap[row.user_id] = row.bonus_count;
  }

  const rewards = (result.results || []).map((r: any) => ({
    user_id: r.user_id,
    total_stars: r.total_stars || 0,
    total_diamonds: r.total_diamonds || 0,
    bonus_diamonds: bonusMap[r.user_id] || 0,
    current_streak: r.current_streak || 0,
    best_streak: r.best_streak || 0,
    diamond_streak: r.diamond_streak || 0,
    best_diamond_streak: r.best_diamond_streak || 0,
    last_active_date: r.last_active_date || '',
    created_at: r.created_at || '',
  }));

  // Summary
  const totalUsers = rewards.length;
  const totalStars = rewards.reduce((sum: number, r: any) => sum + r.total_stars, 0);
  const totalDiamonds = rewards.reduce((sum: number, r: any) => sum + r.total_diamonds, 0);
  const totalBonusDiamonds = rewards.reduce((sum: number, r: any) => sum + r.bonus_diamonds, 0);

  return new Response(JSON.stringify({
    summary: {
      totalUsers,
      totalStars,
      totalDiamonds,
      totalBonusDiamonds,
    },
    rewards,
  }), { headers: { 'Content-Type': 'application/json' } });
};
