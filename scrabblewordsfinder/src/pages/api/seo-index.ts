import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET: List all SEO index entries (optional ?status=indexed filter)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  // Return sync log entries
  if (action === 'sync-log') {
    const logs = await db.prepare('SELECT * FROM seo_sync_log ORDER BY synced_at DESC LIMIT 100').all();
    return new Response(JSON.stringify({ entries: logs.results || [] }), { headers: { 'Content-Type': 'application/json' } });
  }

  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const pinned = url.searchParams.get('pinned');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  let query = 'SELECT * FROM seo_index';
  let countQuery = 'SELECT COUNT(*) as total FROM seo_index';
  const conditions: string[] = [];
  const params: string[] = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(url LIKE ? OR seo_title LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (pinned === '1') {
    conditions.push('pinned = 1');
  }

  const updatedAfter = url.searchParams.get('updated_after');
  if (updatedAfter) {
    conditions.push('updated_at > ?');
    params.push(updatedAfter);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }
  const sortField = url.searchParams.get('sort') || '';
  const validSorts = ['url','status','seo_title_length','seo_desc_length','seo_h2_count','seo_word_count','seo_internal_links','last_crawled','pinned'];
  let orderClause: string;
  if (search && !sortField) {
    // When searching without explicit sort, prioritize shorter URLs (more exact matches first)
    orderClause = ' ORDER BY LENGTH(url) ASC, url ASC';
  } else {
    orderClause = ' ORDER BY ' + (validSorts.includes(sortField) ? sortField : 'url') + ' ' + (url.searchParams.get('order') === 'desc' ? 'DESC' : 'ASC');
  }
  query += orderClause + ' LIMIT ? OFFSET ?';

  const result = await db.prepare(query).bind(...params, limit, offset).all();
  const totalResult = await db.prepare(countQuery).bind(...params).first();
  const countResult = await db.prepare('SELECT status, COUNT(*) as count FROM seo_index GROUP BY status').all();
  const avgResult = await db.prepare("SELECT ROUND(AVG(seo_h2_count),1) as avg_h2, SUM(CASE WHEN seo_meta_keywords != '' THEN 1 ELSE 0 END) as has_keywords FROM seo_index").first();

  return new Response(JSON.stringify({
    entries: result.results,
    summary: countResult.results,
    total: totalResult?.total || 0,
    avg_h2: avgResult?.avg_h2 || 0,
    has_keywords: avgResult?.has_keywords || 0,
    limit,
    offset,
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

  // Log a field-level change to seo_sync_log
  if (body._sync_log) {
    await db.prepare(
      `INSERT INTO seo_sync_log (url, field_changed, old_value, new_value) VALUES (?, ?, ?, ?)`
    ).bind(body.url || '', body.field_changed || '', body.old_value || '', body.new_value || '').run();
    return new Response(JSON.stringify({ success: true, sync_logged: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sync SEO to Pages — updates the last sync timestamp
  if (body._sync_pages) {
    await db.prepare("UPDATE site_status SET last_seo_sync_to_pages = datetime('now') WHERE id = 1").run();
    const count = await db.prepare("SELECT COUNT(*) as total FROM seo_index WHERE updated_at >= (SELECT COALESCE(last_seo_sync_to_pages, '2020-01-01') FROM site_status WHERE id = 1)").first();
    return new Response(JSON.stringify({ success: true, count: count?.total || 0, synced_at: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get sync info — returns last sync time and count of pages updated since
  if (body._get_sync_info) {
    const info = await db.prepare("SELECT COALESCE(last_seo_sync_to_pages, '') as last_sync FROM site_status WHERE id = 1").first();
    const lastSync = (info as any)?.last_sync || '';
    const countResult = await db.prepare("SELECT COUNT(*) as total FROM seo_index WHERE updated_at > ?").bind(lastSync || '2020-01-01').first();
    return new Response(JSON.stringify({ last_sync: lastSync, pending_count: (countResult as any)?.total || 0 }), {
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
  const { id } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
  }

  const allowed = ['status', 'last_crawled', 'first_indexed', 'notes', 'pinned', 'seo_title', 'seo_h1', 'seo_meta_description', 'seo_canonical', 'seo_h2_count', 'seo_json_ld_article', 'seo_json_ld_faq', 'seo_meta_keywords', 'seo_og_title', 'seo_og_description', 'seo_og_image', 'seo_word_count', 'seo_internal_links', 'seo_title_length', 'seo_desc_length'];
  const updates: string[] = [];
  const values: any[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  await db.prepare(`UPDATE seo_index SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

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
