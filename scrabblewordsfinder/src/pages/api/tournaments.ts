import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/tournaments/ — Tournament calendar CRUD
 *
 * GET  /api/tournaments/                     → all tournaments (default: upcoming + active)
 * GET  /api/tournaments/?status=completed    → completed tournaments
 * GET  /api/tournaments/?recent=30           → last 30 days completed
 * GET  /api/tournaments/?all=true            → everything
 * POST /api/tournaments/                     → create a tournament
 * PUT  /api/tournaments/                     → update a tournament by id
 * DELETE /api/tournaments/?id=N              → delete a tournament
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const status = url.searchParams.get('status');
    const recent = url.searchParams.get('recent');
    const all = url.searchParams.get('all');

    let query: string;
    let params: any[] = [];

    if (all === 'true') {
      query = 'SELECT * FROM tournaments ORDER BY start_date DESC';
    } else if (recent) {
      const days = parseInt(recent) || 30;
      query = `SELECT * FROM tournaments WHERE status = 'completed' AND end_date >= date('now', '-${days} days') ORDER BY end_date DESC`;
    } else if (status) {
      query = 'SELECT * FROM tournaments WHERE status = ? ORDER BY start_date ASC';
      params = [status];
    } else {
      // Default: upcoming + active
      query = "SELECT * FROM tournaments WHERE status IN ('upcoming', 'active') ORDER BY start_date ASC";
    }

    const { results } = params.length
      ? await db.prepare(query).bind(...params).all()
      : await db.prepare(query).all();

    return json({ tournaments: results, total: results.length });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const { name, location, country, start_date, end_date, tier, status, wespa_rated, url: tourUrl, winner, participants } = body;

    if (!name || !start_date || !end_date) {
      return jsonError('name, start_date, and end_date are required', 400);
    }

    const validTiers = ['platinum', 'gold', 'silver', 'bronze', 'others'];
    const validStatuses = ['upcoming', 'active', 'completed'];

    const stmt = db.prepare(
      `INSERT INTO tournaments (name, location, country, start_date, end_date, tier, status, wespa_rated, url, winner, participants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(
      name,
      location || '',
      country || '',
      start_date,
      end_date,
      validTiers.includes(tier) ? tier : 'others',
      validStatuses.includes(status) ? status : 'upcoming',
      wespa_rated !== undefined ? (wespa_rated ? 1 : 0) : 1,
      tourUrl || '',
      winner || '',
      participants || 0
    ).run();

    return json({ success: true, message: `Tournament "${name}" created` }, 201);
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) return jsonError('id is required', 400);

    const allowed = ['name', 'location', 'country', 'start_date', 'end_date', 'tier', 'status', 'wespa_rated', 'url', 'winner', 'participants'];
    const updates: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return jsonError('No valid fields to update', 400);

    params.push(id);
    await db.prepare(`UPDATE tournaments SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    const row = await db.prepare('SELECT * FROM tournaments WHERE id = ?').bind(id).first();
    return json({ success: true, tournament: row });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const id = url.searchParams.get('id');
    if (!id) return jsonError('id query param is required', 400);

    await db.prepare('DELETE FROM tournaments WHERE id = ?').bind(parseInt(id)).run();
    return json({ success: true, message: `Deleted tournament id ${id}` });
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
