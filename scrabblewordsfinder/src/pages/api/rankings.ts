import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/rankings/ — Player rankings CRUD
 *
 * GET  /api/rankings/                    → all rankings (default: wespa type)
 * GET  /api/rankings/?type=ytd           → YTD rankings
 * GET  /api/rankings/?type=wespa&limit=20 → top 20 WESPA
 * POST /api/rankings/                    → create/update a player ranking
 * PUT  /api/rankings/                    → update a player by id
 * DELETE /api/rankings/?id=N             → delete a player ranking
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const type = url.searchParams.get('type') || 'wespa';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const country = url.searchParams.get('country');

    let query = 'SELECT * FROM player_rankings WHERE ranking_type = ?';
    const params: any[] = [type];

    if (country) {
      query += ' AND country_code = ?';
      params.push(country.toUpperCase());
    }

    query += ' AND active = 1 ORDER BY rank ASC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return json({ rankings: results, type, total: results.length });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const { rank, name, country, country_code, rating, games_played, peak_rating, titles, ranking_type } = body;

    if (!rank || !name) return jsonError('rank and name are required', 400);

    const stmt = db.prepare(
      `INSERT INTO player_rankings (rank, name, country, country_code, rating, games_played, peak_rating, titles, ranking_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    await stmt.bind(
      rank,
      name,
      country || '',
      (country_code || '').toUpperCase(),
      rating || 0,
      games_played || 0,
      peak_rating || 0,
      titles || '',
      ranking_type || 'wespa'
    ).run();

    return json({ success: true, message: `Added ${name} at rank ${rank}` }, 201);
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

    const allowed = ['rank', 'name', 'country', 'country_code', 'rating', 'games_played', 'peak_rating', 'titles', 'ranking_type', 'active'];
    const updates: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) return jsonError('No valid fields to update', 400);

    updates.push("last_updated = datetime('now')");
    params.push(id);

    await db.prepare(`UPDATE player_rankings SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();

    const row = await db.prepare('SELECT * FROM player_rankings WHERE id = ?').bind(id).first();
    return json({ success: true, player: row });
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

    await db.prepare('DELETE FROM player_rankings WHERE id = ?').bind(parseInt(id)).run();
    return json({ success: true, message: `Deleted ranking id ${id}` });
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
