import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/banners — Manage banner rotation pool
 *
 * GET  /api/banners              → returns all banners with their status
 * GET  /api/banners?active=true  → returns only active banners (for rotation)
 * PUT  /api/banners              → toggle a banner's status { option_number, status }
 *
 * CUSTOMIZE: Change (env as any).DB to your D1 binding name
 */

const DB_BINDING = 'DB'; // ← CHANGE THIS: e.g. 'BUGS_DB' for xConvert

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any)[DB_BINDING];
  if (!db) return jsonError('DB not configured', 500);

  try {
    const activeOnly = url.searchParams.get('active') === 'true';
    const query = activeOnly
      ? 'SELECT * FROM banners WHERE status = ? ORDER BY option_number'
      : 'SELECT * FROM banners ORDER BY option_number';
    const params = activeOnly ? ['active'] : [];

    const { results } = params.length
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return json({ banners: results });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any)[DB_BINDING];
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const { option_number, status } = body;

    if (!option_number || !status) {
      return jsonError('option_number and status are required', 400);
    }

    if (!['active', 'inactive'].includes(status)) {
      return jsonError('status must be "active" or "inactive"', 400);
    }

    const opt = Number(option_number);
    if (!opt || opt < 1 || opt > 10) {
      return jsonError('option_number must be between 1 and 10', 400);
    }

    await db.prepare(
      "UPDATE banners SET status = ?, updated_at = datetime('now') WHERE option_number = ?"
    ).bind(status, opt).run();

    const row = await db.prepare('SELECT * FROM banners WHERE option_number = ?').bind(opt).first();
    if (!row) return jsonError('Banner not found', 404);

    const countRow = await db.prepare("SELECT COUNT(*) as active_count FROM banners WHERE status = 'active'").first();

    return json({ banner: row, active_count: countRow?.active_count || 0 });
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
