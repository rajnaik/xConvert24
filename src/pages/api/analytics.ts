import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/analytics — log a user interaction event
 *   Body: { user_id: string, event: string, page?: string, metadata?: string }
 *
 * GET /api/analytics?user_id=xxx — get recent events for a user (admin)
 * GET /api/analytics?event=xxx — get recent events by type (admin)
 * GET /api/analytics — get last 50 events (admin)
 */

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ ok: true }), {
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

  const { user_id, event, page, metadata } = body;
  if (!user_id || !event) {
    return new Response(JSON.stringify({ error: 'user_id and event required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT INTO analytics (user_id, event, page, metadata) VALUES (?, ?, ?, ?)'
  ).bind(user_id, event, page || null, metadata || null).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ events: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userId = url.searchParams.get('user_id');
  const event = url.searchParams.get('event');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

  let rows;
  if (userId) {
    rows = await db.prepare(
      'SELECT * FROM analytics WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(userId, limit).all();
  } else if (event) {
    rows = await db.prepare(
      'SELECT * FROM analytics WHERE event = ? ORDER BY created_at DESC LIMIT ?'
    ).bind(event, limit).all();
  } else {
    rows = await db.prepare(
      'SELECT * FROM analytics ORDER BY created_at DESC LIMIT ?'
    ).bind(limit).all();
  }

  return new Response(JSON.stringify({ events: rows?.results || [] }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
