import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/clicks — Log a user click event with full tracking metadata
 *   Body: { user_id, ui_element, url?, session_id?, screen_width?, screen_height?,
 *           viewport_width?, viewport_height?, click_x?, click_y?, page_title?,
 *           device_type?, browser?, os? }
 *   Server captures: ip, country, city, region, lat/lng, timezone, user_agent, referrer, language
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: any;
    try {
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

    // Server-side metadata from Cloudflare headers
    const ip_address = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const user_agent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const language = request.headers.get('accept-language')?.split(',')[0] || '';

    // Cloudflare request.cf geo data
    const cf = (request as any).cf || {};
    const city = cf.city || '';
    const region = cf.region || '';
    const latitude = cf.latitude ? parseFloat(cf.latitude) : null;
    const longitude = cf.longitude ? parseFloat(cf.longitude) : null;
    const timezone = cf.timezone || '';

    // Client-side metadata from body
    const session_id = body.session_id || '';
    const screen_width = body.screen_width ? parseInt(body.screen_width) : null;
    const screen_height = body.screen_height ? parseInt(body.screen_height) : null;
    const viewport_width = body.viewport_width ? parseInt(body.viewport_width) : null;
    const viewport_height = body.viewport_height ? parseInt(body.viewport_height) : null;
    const click_x = body.click_x != null ? parseInt(body.click_x) : null;
    const click_y = body.click_y != null ? parseInt(body.click_y) : null;
    const page_title = body.page_title || '';
    const device_type = body.device_type || '';
    const browser = body.browser || '';
    const os = body.os || '';

    const writePromise = db.prepare(`
      INSERT INTO clicks (
        user_id, ui_element, url, ip_address,
        country, city, region, latitude, longitude, timezone,
        user_agent, referrer, device_type, browser, os, language,
        screen_width, screen_height, viewport_width, viewport_height,
        session_id, click_x, click_y, page_title
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      String(user_id), String(ui_element), String(url || ''), ip_address,
      country, city, region, latitude, longitude, timezone,
      user_agent, referrer, device_type, browser, os, language,
      screen_width, screen_height, viewport_width, viewport_height,
      session_id, click_x, click_y, page_title
    ).run();

    // Fire-and-forget with waitUntil if available
    const ctx = (locals as any).cfContext || (locals as any).runtime?.ctx;
    if (ctx?.waitUntil) {
      ctx.waitUntil(writePromise);
    } else {
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
 * GET /api/clicks — Read recent clicks (optional filters)
 *   ?user_id=, ?ui_element=, ?limit=, ?count=true, ?country=
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fast path: return only the total count
    if (url.searchParams.get('count') === 'true') {
      const row = await db.prepare('SELECT COUNT(*) as total FROM clicks').first();
      return new Response(JSON.stringify({ total: row?.total || 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = url.searchParams.get('user_id');
    const element = url.searchParams.get('ui_element');
    const country = url.searchParams.get('country');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50') || 50, 500);

    let query = 'SELECT * FROM clicks';
    const conditions: string[] = [];
    const params: any[] = [];

    if (userId) { conditions.push('user_id = ?'); params.push(userId); }
    if (element) { conditions.push('ui_element = ?'); params.push(element); }
    if (country) { conditions.push('country = ?'); params.push(country); }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();

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
