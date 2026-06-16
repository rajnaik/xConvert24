import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const body = await request.json();
    const { user_id, ui_element, url, session_id, page_title, screen_width, screen_height, viewport_width, viewport_height, click_x, click_y } = body;

    const ip = request.headers.get('cf-connecting-ip') || '';
    const ua = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const language = request.headers.get('accept-language')?.split(',')[0] || '';

    const isMobile = /Mobile|Android|iPhone/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);
    const device_type = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

    let browser = 'other';
    if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Edg')) browser = 'edge';
    else if (ua.includes('Chrome')) browser = 'chrome';
    else if (ua.includes('Safari')) browser = 'safari';

    let os = 'other';
    if (ua.includes('Windows')) os = 'windows';
    else if (ua.includes('Mac')) os = 'macos';
    else if (ua.includes('Linux')) os = 'linux';
    else if (ua.includes('Android')) os = 'android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'ios';

    await db.prepare(`INSERT INTO clicks (user_id, ui_element, url, ip_address, country, user_agent, referrer, device_type, browser, os, language, session_id, screen_width, screen_height, viewport_width, viewport_height, click_x, click_y, page_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(user_id || '', ui_element || '', url || '', ip, country, ua, referrer, device_type, browser, os, language, session_id || '', screen_width || null, screen_height || null, viewport_width || null, viewport_height || null, click_x || null, click_y || null, page_title || '')
      .run();

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const url = new URL(request.url);
    const count = url.searchParams.get('count');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (count === 'true') {
      const result = await db.prepare('SELECT COUNT(*) as total FROM clicks').first();
      return new Response(JSON.stringify({ total: result?.total || 0 }), { headers: { 'Content-Type': 'application/json' } });
    }

    const results = await db.prepare('SELECT * FROM clicks ORDER BY id DESC LIMIT ?').bind(limit).all();
    return new Response(JSON.stringify({ clicks: results.results }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
