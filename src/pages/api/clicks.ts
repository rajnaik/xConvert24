import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/clicks — Log a user click event (high-volume, non-blocking)
 *   Body: { user_id: string, ui_element: string }
 *
 * Designed for high concurrency:
 * - Cloudflare Workers run in parallel isolates (multi-threaded by nature)
 * - Uses waitUntil() to respond immediately while DB write completes in background
 * - Minimal validation for speed
 */

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (env as any).BUGS_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: any;
    try {
      // Try parsing as JSON regardless of Content-Type header
      // (sendBeacon on some mobile browsers may strip the header)
      const text = await request.text();
      body = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { user_id, ui_element, url } = body;
    if (!user_id || !ui_element) {
      return new Response(JSON.stringify({ error: 'user_id and ui_element are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get client IP from Cloudflare header (or fallback)
    const ipAddress = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || '';

    // Fire-and-forget: use waitUntil so response returns immediately
    // while the DB write completes in the background
    const ctx = (locals as any).cfContext || (locals as any).runtime?.ctx;
    const writePromise = db
      .prepare('INSERT INTO clicks (user_id, ui_element, url, ip_address) VALUES (?, ?, ?, ?)')
      .bind(String(user_id), String(ui_element), String(url || ''), String(ipAddress))
      .run();

    if (ctx?.waitUntil) {
      ctx.waitUntil(writePromise);
    } else {
      // Fallback: await if no waitUntil available (e.g. local dev)
      await writePromise;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET /api/clicks — Read recent clicks (optional ?user_id= filter, ?limit=)
 * Also returns `total` count of all clicks in the table.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const db = (env as any).BUGS_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fast path: return only the total count (used by footer counter)
    if (url.searchParams.get('count') === 'true') {
      const row = await db.prepare('SELECT COUNT(*) as total FROM clicks').first();
      return new Response(JSON.stringify({ total: row?.total || 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = url.searchParams.get('user_id');
    const element = url.searchParams.get('ui_element');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 200);

    let query = 'SELECT id, user_id, ui_element, url, ip_address, created_at FROM clicks';
    const conditions: string[] = [];
    const params: any[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (element) {
      conditions.push('ui_element = ?');
      params.push(element);
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();

    // Get total count (unfiltered)
    const countRow = await db.prepare('SELECT COUNT(*) as count FROM clicks').first();
    const total = countRow?.count ?? results.length;

    return new Response(JSON.stringify({ clicks: results, total }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
