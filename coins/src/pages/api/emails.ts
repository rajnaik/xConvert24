import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const read = url.searchParams.get('read');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = 'SELECT * FROM emails';
    const conditions: string[] = [];
    const binds: any[] = [];

    if (category) { conditions.push('category = ?'); binds.push(category); }
    if (read !== null && url.searchParams.has('read')) { conditions.push('read = ?'); binds.push(parseInt(read!)); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id DESC LIMIT ?';
    binds.push(limit);

    const results = await db.prepare(query).bind(...binds).all();
    const stats = await db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN read=0 THEN 1 ELSE 0 END) as unread, SUM(CASE WHEN actioned=1 THEN 1 ELSE 0 END) as actioned FROM emails').first();

    return new Response(JSON.stringify({ emails: results.results, stats }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const body = await request.json();
    const { id, comment, read, actioned } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    const updates: string[] = [];
    const binds: any[] = [];
    if (comment !== undefined) { updates.push('comment = ?'); binds.push(comment); }
    if (read !== undefined) { updates.push('read = ?'); binds.push(read); }
    if (actioned !== undefined) {
      updates.push('actioned = ?'); binds.push(actioned);
      if (actioned === 1) { updates.push("date_actioned = datetime('now')"); }
    }
    binds.push(id);

    await db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).bind(...binds).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const body = await request.json();
    const { id } = body;
    if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

    await db.prepare('DELETE FROM emails WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
