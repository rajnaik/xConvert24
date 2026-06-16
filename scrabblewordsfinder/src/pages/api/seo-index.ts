import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET: List all SEO index entries (optional ?status=indexed filter)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let query = 'SELECT * FROM seo_index';
  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('url LIKE ?');
    params.push(`%${search}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY updated_at DESC LIMIT 1000';

  const result = await db.prepare(query).bind(...params).all();
  const countResult = await db.prepare('SELECT status, COUNT(*) as count FROM seo_index GROUP BY status').all();

  return new Response(JSON.stringify({
    entries: result.results,
    summary: countResult.results,
    total: result.results.length,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Add or update an SEO index entry (or log an update submission)
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;

  // Log submission to seo_update_log table
  if (body._log) {
    await db.prepare(
      `INSERT INTO seo_update_log (status, url_count, raw_text) VALUES (?, ?, ?)`
    ).bind(body.status || '', body.url_count || 0, body.raw_text || '').run();
    return new Response(JSON.stringify({ success: true, logged: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url: pageUrl, status, last_crawled, first_indexed, notes, force_status } = body;

  if (!pageUrl) {
    return new Response(JSON.stringify({ error: 'url is required' }), { status: 400 });
  }

  if (force_status) {
    // Force update status (used by "New Updates" button)
    // If marking as indexed and no first_indexed provided, auto-set to today
    const effectiveFirstIndexed = (status === 'indexed' && !first_indexed) ? new Date().toISOString().split('T')[0] : (first_indexed || null);
    await db.prepare(`
      INSERT INTO seo_index (url, status, last_crawled, first_indexed, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(url) DO UPDATE SET
        status = excluded.status,
        last_crawled = COALESCE(excluded.last_crawled, seo_index.last_crawled),
        first_indexed = COALESCE(excluded.first_indexed, seo_index.first_indexed),
        notes = CASE WHEN excluded.notes = '' THEN seo_index.notes ELSE excluded.notes END,
        updated_at = datetime('now')
    `).bind(pageUrl, status || 'indexed', last_crawled || null, effectiveFirstIndexed, notes || '').run();
  } else {
    // Soft upsert — don't overwrite existing status (used by Sync Sitemap)
    await db.prepare(`
      INSERT INTO seo_index (url, status, last_crawled, first_indexed, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(url) DO UPDATE SET
        last_crawled = COALESCE(excluded.last_crawled, seo_index.last_crawled),
        first_indexed = COALESCE(excluded.first_indexed, seo_index.first_indexed),
        notes = CASE WHEN excluded.notes = '' THEN seo_index.notes ELSE excluded.notes END,
        updated_at = datetime('now')
    `).bind(pageUrl, status || 'discovered', last_crawled || null, first_indexed || null, notes || '').run();
  }

  return new Response(JSON.stringify({ success: true, url: pageUrl }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT: Update an existing entry by id
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { id, status, last_crawled, notes } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
  }

  await db.prepare(`
    UPDATE seo_index SET status = ?, last_crawled = ?, notes = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(status || 'indexed', last_crawled || null, notes || '', id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE: Remove an entry by id, or nuke all with ?nuke=true
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const nuke = url.searchParams.get('nuke');
  const id = url.searchParams.get('id');

  if (nuke === 'true') {
    await db.prepare('DELETE FROM seo_index').run();
    return new Response(JSON.stringify({ success: true, nuked: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!id) {
    return new Response(JSON.stringify({ error: 'id param required' }), { status: 400 });
  }

  await db.prepare('DELETE FROM seo_index WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
