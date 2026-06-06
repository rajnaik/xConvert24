import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/rewards-granted?user_id=xxx — get rewards for a user
 * POST /api/rewards-granted — record a reward grant (called by event system)
 *   Body: { user_id: string, activity: string, coins: number }
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ rewards: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = url.searchParams.get('user_id');
  let rows;

  if (userId) {
    rows = await db.prepare(
      'SELECT * FROM rewards_granted WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(userId).all();
  } else {
    rows = await db.prepare(
      'SELECT * FROM rewards_granted ORDER BY created_at DESC LIMIT 50'
    ).all();
  }

  return new Response(JSON.stringify({ rewards: rows?.results || [] }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { user_id, activity, coins } = body;
  if (!user_id || !activity || coins === undefined) {
    return new Response(JSON.stringify({ error: 'user_id, activity, and coins required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT INTO rewards_granted (user_id, activity, coins) VALUES (?, ?, ?)'
  ).bind(user_id, activity, coins).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
