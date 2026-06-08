import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/prettifylog — List prettify log entries (optional ?page_type= and ?page_slug= filters, default last 20)
 * POST /api/prettifylog — Log a prettify run for a blog or converter
 *   Body: { page_type: 'blog'|'converter', page_slug: string, status: 0|1 }
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const pageType = url.searchParams.get('page_type');
  const pageSlug = url.searchParams.get('page_slug');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20') || 20, 100);

  let query: string;
  let params: any[];

  if (pageType && pageSlug) {
    query = 'SELECT id, page_type, page_slug, status, date_modified FROM PrettifyLog WHERE page_type = ? AND page_slug = ? ORDER BY date_modified DESC LIMIT ?';
    params = [pageType, pageSlug, limit];
  } else if (pageType) {
    query = 'SELECT id, page_type, page_slug, status, date_modified FROM PrettifyLog WHERE page_type = ? ORDER BY date_modified DESC LIMIT ?';
    params = [pageType, limit];
  } else {
    query = 'SELECT id, page_type, page_slug, status, date_modified FROM PrettifyLog ORDER BY date_modified DESC LIMIT ?';
    params = [limit];
  }

  const { results } = await db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ logs: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { page_type, page_slug, status } = body;
  if (!page_type || !page_slug || (status !== 0 && status !== 1)) {
    return new Response(JSON.stringify({ error: 'page_type (blog|converter), page_slug (string), and status (0 or 1) are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (page_type !== 'blog' && page_type !== 'converter') {
    return new Response(JSON.stringify({ error: 'page_type must be "blog" or "converter"' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare('INSERT INTO PrettifyLog (page_type, page_slug, status) VALUES (?, ?, ?)')
    .bind(page_type, page_slug, status).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
