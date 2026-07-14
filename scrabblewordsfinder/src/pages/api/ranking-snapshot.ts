import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/ranking-snapshot/ — Take a snapshot of current rankings (admin)
 * GET  /api/ranking-snapshot/ — List snapshot dates
 */

export const prerender = false;

export const POST: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if snapshot already exists for today
    const existing = await db.prepare(
      "SELECT COUNT(*) as cnt FROM ranking_snapshots WHERE snapshot_date = ?"
    ).bind(today).first();

    if (existing && existing.cnt > 0) {
      return json({ success: false, message: `Snapshot already exists for ${today} (${existing.cnt} rows)` });
    }

    // Snapshot all active rankings
    const { results } = await db.prepare(
      "SELECT ranking_type, name, rank, rating, country_code FROM player_rankings WHERE active = 1 ORDER BY ranking_type, rank"
    ).all();

    if (!results || results.length === 0) {
      return json({ success: false, message: 'No rankings to snapshot' });
    }

    // Insert all rows
    let inserted = 0;
    for (const r of results as any[]) {
      await db.prepare(
        "INSERT INTO ranking_snapshots (snapshot_date, ranking_type, player_name, rank, rating, country_code) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(today, r.ranking_type, r.name, r.rank, r.rating, r.country_code || '').run();
      inserted++;
    }

    return json({ success: true, date: today, rows: inserted, message: `Snapshot taken: ${inserted} players across all ranking types` });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const { results } = await db.prepare(
      "SELECT snapshot_date, ranking_type, COUNT(*) as players FROM ranking_snapshots GROUP BY snapshot_date, ranking_type ORDER BY snapshot_date DESC LIMIT 50"
    ).all();

    return json({ snapshots: results });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function json(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
