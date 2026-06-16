import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const user_id = url.searchParams.get('user_id') || '';

  const { results } = await db.prepare('SELECT * FROM favourites WHERE user_id = ? AND status = ?').bind(user_id, 'active').all();
  return new Response(JSON.stringify({ favourites: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { coinid, user_id } = body;

  if (!coinid) return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });

  // Toggle: if already favourited, remove it; otherwise add it
  const { results } = await db.prepare('SELECT id FROM favourites WHERE coinid = ? AND user_id = ? AND status = ?').bind(coinid, user_id || '', 'active').all();

  if (results.length > 0) {
    await db.prepare('DELETE FROM favourites WHERE coinid = ? AND user_id = ?').bind(coinid, user_id || '').run();
    return new Response(JSON.stringify({ success: true, action: 'removed' }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    await db.prepare('INSERT OR REPLACE INTO favourites (coinid, user_id, status) VALUES (?, ?, ?)').bind(coinid, user_id || '', 'active').run();
    return new Response(JSON.stringify({ success: true, action: 'added' }), { headers: { 'Content-Type': 'application/json' } });
  }
};
