import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const activeOnly = url.searchParams.get('active');
  const query = activeOnly ? 'SELECT * FROM tools WHERE status = 1 ORDER BY sort_order ASC' : 'SELECT * FROM tools ORDER BY sort_order ASC';

  const { results } = await db.prepare(query).all();
  return new Response(JSON.stringify({ tools: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { name, description, category, rating, pricing, url: toolUrl, badge, status, sort_order } = body;

  if (!name) return new Response(JSON.stringify({ error: 'Name required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  await db.prepare(
    `INSERT INTO tools (name, description, category, rating, pricing, url, badge, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(name, description || '', category || '', rating || 0, pricing || '', toolUrl || '', badge || '', status ?? 1, sort_order || 0).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id, name, description, category, rating, pricing, url: toolUrl, badge, status, sort_order } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (category !== undefined) { updates.push('category = ?'); values.push(category); }
  if (rating !== undefined) { updates.push('rating = ?'); values.push(rating); }
  if (pricing !== undefined) { updates.push('pricing = ?'); values.push(pricing); }
  if (toolUrl !== undefined) { updates.push('url = ?'); values.push(toolUrl); }
  if (badge !== undefined) { updates.push('badge = ?'); values.push(badge); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await db.prepare(`UPDATE tools SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id } = body;
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  await db.prepare('DELETE FROM tools WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
