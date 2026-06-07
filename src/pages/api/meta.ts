import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/meta — list all meta descriptions, or fetch one by ?url=
 * POST /api/meta — upsert a meta description
 *   Body: { url: string, meta_description: string }
 * DELETE /api/meta — delete a meta entry
 *   Body: { url: string }
 */

export const GET: APIRoute = async ({ url: reqUrl }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const urlParam = reqUrl.searchParams.get('url');

  if (urlParam) {
    // Fetch single entry
    const row = await db.prepare('SELECT id, url, meta_description, created_at, updated_at FROM meta WHERE url = ?')
      .bind(urlParam).first();
    if (!row) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ meta: row }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch all
  const { results } = await db.prepare('SELECT id, url, meta_description, created_at, updated_at FROM meta ORDER BY url ASC').all();
  return new Response(JSON.stringify({ entries: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url, meta_description } = body;
  if (!url || meta_description === undefined) {
    return new Response(JSON.stringify({ error: 'url and meta_description are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Upsert: insert or update on conflict
  await db.prepare(
    `INSERT INTO meta (url, meta_description, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(url) DO UPDATE SET
       meta_description = excluded.meta_description,
       updated_at = datetime('now')`
  ).bind(url, meta_description).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { url } = body;
  if (!url) {
    return new Response(JSON.stringify({ error: 'url is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare('DELETE FROM meta WHERE url = ?').bind(url).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
