import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const countOnly = url.searchParams.get('count');
  if (countOnly) {
    const result = await db.prepare('SELECT COUNT(*) as count FROM emails').first();
    return new Response(JSON.stringify({ count: result?.count || 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { results } = await db.prepare('SELECT * FROM emails ORDER BY created_at DESC LIMIT 200').all();
  return new Response(JSON.stringify({ emails: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id, read, comment, actioned } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const updates: string[] = [];
  const values: any[] = [];

  if (read !== undefined) { updates.push('read = ?'); values.push(read); }
  if (comment !== undefined) { updates.push('comment = ?'); values.push(comment); }
  if (actioned !== undefined) {
    updates.push('actioned = ?'); values.push(actioned);
    if (actioned) { updates.push("date_actioned = datetime('now')"); }
  }

  if (!updates.length) return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  values.push(id);
  await db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id } = body;
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  await db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
