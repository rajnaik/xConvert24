import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * POST /api/heartbeat — Upsert a live session (called every 30s by client)
 *   Body: { uid, page }
 *   Server captures: ip_address, user_agent
 *
 * GET /api/heartbeat — Returns active sessions (last_seen within 2 minutes)
 *   Query: ?minutes=N (default 2)
 *   Returns: { sessions: [...], count: N }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    if (!db) return json({ error: 'DB not configured' }, 500);

    let body: any;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const { uid, page } = body;
    if (!uid || !page) {
      return json({ error: 'Missing uid or page' }, 400);
    }

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const city = (request as any).cf?.city || '';

    // Fetch existing row to check if page changed (for history tracking)
    const existing = await db.prepare(
      `SELECT page, page_history FROM live_sessions WHERE uid = ?`
    ).bind(uid).first();

    let pageHistory: { page: string; ts: string }[] = [];
    if (existing) {
      try {
        pageHistory = JSON.parse((existing as any).page_history || '[]');
      } catch { pageHistory = []; }
    }

    // Append to history if the page changed (or first visit)
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (!existing || (existing as any).page !== page) {
      pageHistory.push({ page, ts: now });
      // Cap at 20 most recent entries
      if (pageHistory.length > 20) {
        pageHistory = pageHistory.slice(-20);
      }
    }

    await db.prepare(`
      INSERT INTO live_sessions (uid, page, ip_address, user_agent, last_seen, page_history, city, country)
      VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET
        page = excluded.page,
        ip_address = excluded.ip_address,
        user_agent = excluded.user_agent,
        last_seen = datetime('now'),
        page_history = excluded.page_history,
        city = excluded.city,
        country = excluded.country
    `).bind(uid, page, ip, userAgent, JSON.stringify(pageHistory), city, country).run();

    // Cleanup stale sessions older than 5 minutes on every write (lightweight)
    await db.prepare(`DELETE FROM live_sessions WHERE last_seen < datetime('now', '-5 minutes')`).run();

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e.message || 'Server error' }, 500);
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = (env as any).DB;
    if (!db) return json({ error: 'DB not configured' }, 500);

    const minutes = parseInt(url.searchParams.get('minutes') || '2', 10);
    const threshold = Math.min(Math.max(minutes, 1), 30); // clamp 1-30

    const { results } = await db.prepare(`
      SELECT uid, page, ip_address, user_agent, last_seen, page_history, city, country
      FROM live_sessions
      WHERE last_seen >= datetime('now', '-' || ? || ' minutes')
      ORDER BY last_seen DESC
    `).bind(threshold).all();

    // Parse page_history JSON for each session
    const sessions = (results || []).map((s: any) => {
      let history: { page: string; ts: string }[] = [];
      try { history = JSON.parse(s.page_history || '[]'); } catch { history = []; }
      return { ...s, page_history: history };
    });

    return json({ sessions, count: sessions.length });
  } catch (e: any) {
    return json({ error: e.message || 'Server error' }, 500);
  }
};
