import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Diamond Leaderboard API
 *
 * GET /api/diamond-leaderboard/?user_id=X
 *   → { leaderboard: [...top 10], user_rank, user_total }
 *
 * Returns top 10 diamond holders + the requesting user's rank.
 * User IDs are anonymised (first 6 chars shown).
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not available' }, 500);

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id') || '';

  // Top 10 by total_diamonds
  const top = await db.prepare(
    'SELECT user_id, total_diamonds, total_stars, best_streak FROM user_rewards WHERE total_diamonds > 0 ORDER BY total_diamonds DESC, total_stars DESC LIMIT 10'
  ).all();

  const leaderboard = (top.results || []).map((row: any, idx: number) => ({
    rank: idx + 1,
    user_id_short: anonymise(row.user_id),
    is_you: row.user_id === userId,
    total_diamonds: row.total_diamonds,
    total_stars: row.total_stars,
    best_streak: row.best_streak,
  }));

  // Get user's own rank if not in top 10
  let userRank: number | null = null;
  let userTotal = 0;
  if (userId) {
    const userRow = await db.prepare(
      'SELECT total_diamonds FROM user_rewards WHERE user_id = ?'
    ).bind(userId).first() as any;

    if (userRow) {
      userTotal = userRow.total_diamonds;
      // Count how many users have more diamonds
      const rankResult = await db.prepare(
        'SELECT COUNT(*) as above FROM user_rewards WHERE total_diamonds > ?'
      ).bind(userTotal).first() as any;
      userRank = (rankResult?.above || 0) + 1;
    }
  }

  return json({ leaderboard, user_rank: userRank, user_total: userTotal });
};

function anonymise(uid: string): string {
  if (!uid) return '???';
  // Show first 6 chars + "..."
  if (uid.length <= 8) return uid.substring(0, 4) + '...';
  return uid.substring(0, 6) + '...';
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
