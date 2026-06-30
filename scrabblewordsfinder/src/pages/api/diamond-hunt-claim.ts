import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

/**
 * Diamond Hunt Claim API
 *
 * GET  /api/diamond-hunt-claim/?page=/sixty-seconds/&user_id=X
 *      Returns active diamond(s) for the given page + whether this user already claimed
 *
 * POST /api/diamond-hunt-claim/
 *      Body: { diamond_id, user_id }
 *      Claims the diamond for the user (if eligible)
 */

export const GET: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const page = url.searchParams.get('page');
  const userId = url.searchParams.get('user_id');

  if (!page) return new Response(JSON.stringify({ error: 'page parameter required' }), { status: 400 });

  // Find active diamonds for this page (include depleted so UI can show "Mined ✓")
  const diamonds = await db.prepare(
    `SELECT id, diamonds_per_claim, diamonds_remaining, end_date
     FROM diamond_hunt
     WHERE dom_loc = ? AND status = 'active'`
  ).bind(page).all();

  const results = (diamonds.results || []).map((d: any) => {
    // Check end_date (skip expired)
    if (d.end_date) {
      const now = new Date().toISOString().split('T')[0];
      if (d.end_date < now) return null;
    }
    return {
      id: d.id,
      diamonds_per_claim: d.diamonds_per_claim,
      diamonds_remaining: d.diamonds_remaining,
      depleted: d.diamonds_remaining <= 0,
    };
  }).filter(Boolean);

  // If user_id provided, check which ones they already claimed
  let claimed: number[] = [];
  if (userId && results.length > 0) {
    const ids = results.map((r: any) => r.id);
    const placeholders = ids.map(() => '?').join(',');
    const claimsResult = await db.prepare(
      `SELECT diamond_id FROM diamond_claims WHERE user_id = ? AND diamond_id IN (${placeholders})`
    ).bind(userId, ...ids).all();
    claimed = (claimsResult.results || []).map((c: any) => c.diamond_id);
  }

  return new Response(JSON.stringify({
    diamonds: results.map((d: any) => ({
      ...d,
      already_claimed: claimed.includes(d.id),
    })),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { diamond_id, user_id } = body;
  if (!diamond_id || !user_id) {
    return new Response(JSON.stringify({ error: 'diamond_id and user_id required' }), { status: 400 });
  }

  // Get the diamond
  const diamond = await db.prepare('SELECT * FROM diamond_hunt WHERE id = ?').bind(diamond_id).first() as any;
  if (!diamond) return new Response(JSON.stringify({ error: 'Diamond not found' }), { status: 404 });
  if (diamond.status !== 'active') return new Response(JSON.stringify({ error: 'Diamond is inactive' }), { status: 403 });
  if (diamond.diamonds_remaining <= 0) return new Response(JSON.stringify({ error: 'No diamonds remaining' }), { status: 410 });

  // Check end_date
  if (diamond.end_date) {
    const now = new Date().toISOString().split('T')[0];
    if (diamond.end_date < now) return new Response(JSON.stringify({ error: 'Diamond hunt expired' }), { status: 410 });
  }

  // Check if already claimed (UNIQUE constraint on diamond_id + user_id)
  const existing = await db.prepare(
    'SELECT id FROM diamond_claims WHERE diamond_id = ? AND user_id = ?'
  ).bind(diamond_id, user_id).first();
  if (existing) {
    return new Response(JSON.stringify({ error: 'Already claimed', already_claimed: true }), { status: 409 });
  }

  // Claim it
  const perClaim = diamond.diamonds_per_claim || 1;
  await db.prepare(
    'INSERT INTO diamond_claims (diamond_id, user_id, diamonds_earned) VALUES (?, ?, ?)'
  ).bind(diamond_id, user_id, perClaim).run();

  // Decrement remaining
  await db.prepare(
    'UPDATE diamond_hunt SET diamonds_remaining = diamonds_remaining - ? WHERE id = ? AND diamonds_remaining >= ?'
  ).bind(perClaim, diamond_id, perClaim).run();

  return new Response(JSON.stringify({
    success: true,
    diamonds_earned: perClaim,
    message: `You found ${perClaim} 💎!`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
