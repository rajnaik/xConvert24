import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/emails — CRUD for the emails table (admin)
 * GET    ?limit=&category=&read=  — list emails
 * PUT    { id, comment?, read?, actioned? } — update email
 * DELETE { id } — delete email
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const category = url.searchParams.get('category');
  const read = url.searchParams.get('read');

  let query = 'SELECT * FROM emails';
  const conditions: string[] = [];
  const params: any[] = [];

  if (category) { conditions.push('category = ?'); params.push(category); }
  if (read === '0' || read === '1') { conditions.push('read = ?'); params.push(parseInt(read)); }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  try {
    const { results } = await db.prepare(query).bind(...params).all();
    const countRow = await db.prepare('SELECT COUNT(*) as total FROM emails').first();
    return json({ emails: results, total: countRow?.total || 0 });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { id, comment, read, actioned } = body;
  if (!id) return json({ error: 'id is required' }, 400);

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (comment !== undefined) { updates.push('comment = ?'); params.push(comment); }
    if (read !== undefined) { updates.push('read = ?'); params.push(read ? 1 : 0); }
    if (actioned !== undefined) {
      updates.push('actioned = ?'); params.push(actioned ? 1 : 0);
      if (actioned) { updates.push("date_actioned = datetime('now')"); }
    }

    if (!updates.length) return json({ error: 'No fields to update' }, 400);

    params.push(id);
    await db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    const row = await db.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first();
    return json({ ok: true, email: row });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  let body: any;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { id } = body;
  if (!id) return json({ error: 'id is required' }, 400);

  try {
    await db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
