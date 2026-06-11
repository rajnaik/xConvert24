import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/banner-clicks — Fetch banner click records
 *   ?limit=50  — max rows to return (default 50, max 200)
 *   ?banner_id=xyz — filter by specific banner_id
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 200);
    const bannerId = url.searchParams.get('banner_id');

    let query = 'SELECT id, banner_id, ip_address, user_agent, referrer, page_url, created_at FROM banner_clicks';
    const params: any[] = [];

    if (bannerId) {
      query += ' WHERE banner_id = ?';
      params.push(bannerId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();

    // Total count
    const countQuery = bannerId
      ? 'SELECT COUNT(*) as total FROM banner_clicks WHERE banner_id = ?'
      : 'SELECT COUNT(*) as total FROM banner_clicks';
    const countRow = bannerId
      ? await db.prepare(countQuery).bind(bannerId).first()
      : await db.prepare(countQuery).first();

    return json({ clicks: results, total: countRow?.total || 0 });
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
