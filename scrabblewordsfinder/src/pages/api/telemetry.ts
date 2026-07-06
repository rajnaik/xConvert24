import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/telemetry?history=true — returns last N checks from DB
 * POST /api/telemetry — saves client-side health check results to DB
 *
 * Note: Health checks are performed CLIENT-SIDE (from the admin page browser).
 * Workers cannot fetch their own hostname (Cloudflare returns 522 on self-referencing subrequests).
 * The admin page performs the actual fetches and POSTs results here for persistence.
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;

  // History mode — return stored telemetry data
  if (url.searchParams.get('history') === 'true') {
    if (!db) return json({ error: 'DB not configured' }, 500);
    try {
      const limit = parseInt(url.searchParams.get('limit') || '500');
      const from = url.searchParams.get('from') || '';
      const to = url.searchParams.get('to') || '';

      let query = 'SELECT * FROM telemetry';
      const conditions: string[] = [];
      const binds: any[] = [];

      if (from) { conditions.push('checked_at >= ?'); binds.push(from); }
      if (to) { conditions.push('checked_at <= ?'); binds.push(to + 'T23:59:59'); }

      if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
      query += ' ORDER BY checked_at DESC LIMIT ?';
      binds.push(limit);

      const { results } = await db.prepare(query).bind(...binds).all();
      return json({ history: results, count: (results || []).length });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // Default: return the endpoint list so the client knows what to check
  return json({
    endpoints: [
      { name: 'Homepage', path: '/' },
      { name: 'Blog', path: '/blog/' },
      { name: 'Guide', path: '/guide/' },
      { name: 'Activities', path: '/activities/' },
      { name: 'Chat', path: '/chat/' },
      { name: 'API Clicks', path: '/api/clicks/?count=true' },
      { name: 'API Banners', path: '/api/banners/?active=true' },
      { name: 'API Site Status', path: '/api/site-status/' },
      { name: 'API Emails', path: '/api/emails/?limit=1' },
    ],
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  try {
    const body = await request.json();
    const { results, checked_at } = body as { results: any[]; checked_at: string };

    if (!results || !Array.isArray(results)) {
      return json({ error: 'Missing results array' }, 400);
    }

    const ts = checked_at || new Date().toISOString();

    for (const r of results) {
      await db.prepare(
        'INSERT INTO telemetry (endpoint_name, path, status_code, response_ms, healthy, checked_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(r.name, r.path, r.status, r.time_ms, r.ok ? 1 : 0, ts).run();
    }

    return json({ saved: results.length, checked_at: ts });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
