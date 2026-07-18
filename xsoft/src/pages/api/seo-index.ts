import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const countOnly = url.searchParams.get('count');
  if (countOnly) {
    const result = await db.prepare('SELECT COUNT(*) as count FROM seo_index').first();
    return new Response(JSON.stringify({ count: result?.count || 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { results } = await db.prepare('SELECT * FROM seo_index ORDER BY url ASC').all();
  return new Response(JSON.stringify({ pages: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id, title, description, keywords, schemas, index_status, notes } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const updates: string[] = [];
  const values: any[] = [];

  if (title !== undefined) { updates.push('title = ?', 'title_length = ?'); values.push(title, title.length); }
  if (description !== undefined) { updates.push('description = ?', 'description_length = ?'); values.push(description, description.length); }
  if (keywords !== undefined) { updates.push('keywords = ?'); values.push(keywords); }
  if (schemas !== undefined) { updates.push('schemas = ?'); values.push(schemas); }
  if (index_status !== undefined) { updates.push('index_status = ?'); values.push(index_status); }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await db.prepare(`UPDATE seo_index SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id } = body;
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  await db.prepare('DELETE FROM seo_index WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
