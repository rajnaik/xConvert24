import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/banner-click — Record a banner click
 *
 * Body: { banner_id: string, page_url?: string }
 * Captures: banner_id, IP, user-agent, referrer, page_url, timestamp
 *
 * CUSTOMIZE: Change (env as any).DB to your D1 binding name
 */

const DB_BINDING = 'DB'; // ← CHANGE THIS: e.g. 'BUGS_DB' for xConvert

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any)[DB_BINDING];
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const banner_id = body.banner_id;

    if (!banner_id || typeof banner_id !== 'string') {
      return jsonError('banner_id is required', 400);
    }

    const ip_address = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const user_agent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const page_url = body.page_url || '';

    await db.prepare(
      `INSERT INTO banner_clicks (banner_id, ip_address, user_agent, referrer, page_url) VALUES (?, ?, ?, ?, ?)`
    ).bind(banner_id, ip_address, user_agent, referrer, page_url).run();

    return json({ success: true });
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
