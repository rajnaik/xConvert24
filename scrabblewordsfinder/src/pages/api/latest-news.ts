import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/latest-news/ — Latest Scrabble news CRUD
 *
 * GET  /api/latest-news/               → active news (last 30 days)
 * GET  /api/latest-news/?all=true      → all news including inactive
 * GET  /api/latest-news/?category=X    → filter by category
 * POST /api/latest-news/               → manually add a news item
 * PUT  /api/latest-news/               → update (toggle active, edit)
 * DELETE /api/latest-news/?id=N        → delete a news item
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const all = url.searchParams.get('all') === 'true';
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

    let query: string;
    let params: any[] = [];

    if (all) {
      query = 'SELECT * FROM latest_news ORDER BY fetched_at DESC LIMIT ?';
      params = [limit];
    } else if (category) {
      query = 'SELECT * FROM latest_news WHERE active = 1 AND category = ? ORDER BY fetched_at DESC LIMIT ?';
      params = [category, limit];
    } else {
      query = "SELECT * FROM latest_news WHERE active = 1 AND fetched_at > datetime('now', '-30 days') ORDER BY fetched_at DESC LIMIT ?";
      params = [limit];
    }

    const { results } = await db.prepare(query).bind(...params).all();
    return json({ news: results, total: results.length });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const { title, summary, source_url, source_name, category, published_date, media_url, media_type } = body;

    if (!title || !summary) return jsonError('title and summary are required', 400);

    await db.prepare(
      `INSERT INTO latest_news (title, summary, source_url, source_name, category, published_date, media_url, media_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      title,
      summary,
      source_url || '',
      source_name || '',
      category || 'general',
      published_date || '',
      media_url || '',
      media_type || ''
    ).run();

    return json({ success: true, message: `News item "${title}" added` }, 201);
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) return jsonError('id is required', 400);

    const allowed = ['title', 'summary', 'source_url', 'source_name', 'category', 'published_date', 'active', 'media_url', 'media_type'];
    const updates: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return jsonError('No valid fields to update', 400);

    params.push(id);
    await db.prepare(`UPDATE latest_news SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    const row = await db.prepare('SELECT * FROM latest_news WHERE id = ?').bind(id).first();
    return json({ success: true, news: row });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const id = url.searchParams.get('id');
    if (!id) return jsonError('id query param is required', 400);

    await db.prepare('DELETE FROM latest_news WHERE id = ?').bind(parseInt(id)).run();
    return json({ success: true, message: `Deleted news id ${id}` });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
