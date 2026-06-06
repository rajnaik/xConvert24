import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/favourites — get recent published favourites (public, non-hidden)
 * POST /api/favourites — publish or update user's favourites
 *   Body: { user_id: string, items: string[], hidden?: boolean }
 * PATCH /api/favourites — toggle hidden status
 *   Body: { user_id: string, hidden: boolean }
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ published: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5'), 20);
  const rows = await db.prepare(
    'SELECT user_id, items, item_count, created_at FROM favourites_published WHERE hidden = 0 ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all();

  return new Response(JSON.stringify({ published: rows?.results || [] }), {
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

  const { user_id, items, hidden } = body;
  if (!user_id || !items || !Array.isArray(items)) {
    return new Response(JSON.stringify({ error: 'user_id and items array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Upsert — replace existing published favourites for this user
  const existing = await db.prepare(
    'SELECT id FROM favourites_published WHERE user_id = ?'
  ).bind(user_id).first();

  const itemsJson = JSON.stringify(items);
  const itemCount = items.length;
  const isHidden = hidden ? 1 : 0;

  if (existing) {
    await db.prepare(
      'UPDATE favourites_published SET items = ?, item_count = ?, hidden = ?, created_at = datetime("now") WHERE user_id = ?'
    ).bind(itemsJson, itemCount, isHidden, user_id).run();
  } else {
    await db.prepare(
      'INSERT INTO favourites_published (user_id, items, item_count, hidden) VALUES (?, ?, ?, ?)'
    ).bind(user_id, itemsJson, itemCount, isHidden).run();
  }

  return new Response(JSON.stringify({ success: true, item_count: itemCount }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
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

  const { user_id, hidden } = body;
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'user_id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'UPDATE favourites_published SET hidden = ? WHERE user_id = ?'
  ).bind(hidden ? 1 : 0, user_id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
