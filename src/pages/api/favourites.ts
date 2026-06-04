import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/favourites — get all favourite counts (sorted by count desc)
 * POST /api/favourites — increment or decrement a favourite count
 *   Body: { href: string, action: 'add' | 'remove' }
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT href, count FROM favourite_counts ORDER BY count DESC'
  ).all();

  return new Response(JSON.stringify({ counts: results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { href, action } = body;
  if (!href || typeof href !== 'string') {
    return new Response(JSON.stringify({ error: 'href is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const delta = action === 'remove' ? -1 : 1;

  // Upsert: insert or update
  await db.prepare(
    'INSERT INTO favourite_counts (href, count) VALUES (?, MAX(0, ?)) ON CONFLICT(href) DO UPDATE SET count = MAX(0, count + ?)'
  ).bind(href, delta, delta).run();

  const row = await db.prepare('SELECT count FROM favourite_counts WHERE href = ?').bind(href).first();

  return new Response(JSON.stringify({ success: true, count: row?.count ?? 0 }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
