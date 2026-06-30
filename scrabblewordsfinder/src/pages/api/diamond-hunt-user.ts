import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

/**
 * Diamond Hunt User API
 *
 * GET /api/diamond-hunt-user/?user_id=X
 *     Returns all claims for this user + today's claims
 */

export const GET: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const userId = url.searchParams.get('user_id');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id parameter required' }), { status: 400 });
  }

  // All claims for this user
  const allClaims = await db.prepare(
    'SELECT diamond_id, diamonds_earned, claimed_at FROM diamond_claims WHERE user_id = ? ORDER BY claimed_at DESC'
  ).bind(userId).all();

  // Today's claims
  const today = new Date().toISOString().split('T')[0];
  const todayClaims = await db.prepare(
    "SELECT diamond_id, diamonds_earned, claimed_at FROM diamond_claims WHERE user_id = ? AND claimed_at >= ? ORDER BY claimed_at DESC"
  ).bind(userId, today + 'T00:00:00').all();

  // Total diamonds earned from hunts
  const totalResult = await db.prepare(
    'SELECT COALESCE(SUM(diamonds_earned), 0) as total FROM diamond_claims WHERE user_id = ?'
  ).bind(userId).first() as any;

  return new Response(JSON.stringify({
    claims: allClaims.results || [],
    today_claims: todayClaims.results || [],
    total_earned: totalResult?.total || 0,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
