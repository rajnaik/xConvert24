import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const { results } = await db.prepare('SELECT * FROM trackerFieldMap ORDER BY id').all();
  return new Response(JSON.stringify({ fields: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { fieldname, lookupid } = body;

  if (!fieldname || !lookupid) return new Response(JSON.stringify({ error: 'fieldname and lookupid required' }), { status: 400 });

  const result = await db.prepare('INSERT INTO trackerFieldMap (fieldname, lookupid) VALUES (?, ?)').bind(fieldname, lookupid).run();
  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), { headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { id, fieldname, lookupid } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('UPDATE trackerFieldMap SET fieldname = ?, lookupid = ? WHERE id = ?').bind(fieldname || '', lookupid || '', id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM trackerFieldMap WHERE id = ?').bind(Number(id)).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
