/**
 * Public API: /api/public/movers/
 * Returns top risers and fallers based on rating changes between snapshots.
 * Query params:
 *   ?type=wespa (default) | ytd | online
 *   ?period=1m (default) | 3m | 6m
 *   ?limit=5 (default, max 20)
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'wespa';
  const period = url.searchParams.get('period') || '1m';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5') || 5, 20);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers });
    }

    // Determine how far back to look based on period
    let monthsBack = 1;
    if (period === '3m') monthsBack = 3;
    else if (period === '6m') monthsBack = 6;

    // Get the two most relevant snapshot dates
    const snapshots = await db.prepare(
      'SELECT DISTINCT snapshot_date FROM ranking_snapshots WHERE ranking_type = ? ORDER BY snapshot_date DESC LIMIT ?'
    ).bind(type, monthsBack + 1).all();

    const dates = (snapshots.results || []).map((r: any) => r.snapshot_date);
    if (dates.length < 2) {
      return new Response(JSON.stringify({
        type,
        period,
        risers: [],
        fallers: [],
        message: 'Insufficient snapshot data for comparison'
      }), { status: 200, headers });
    }

    const currentDate = dates[0];
    const previousDate = dates[dates.length - 1]; // Furthest back within limit

    // Get current snapshot
    const currentRes = await db.prepare(
      'SELECT player_name, rank, rating, country_code FROM ranking_snapshots WHERE snapshot_date = ? AND ranking_type = ?'
    ).bind(currentDate, type).all();

    // Get previous snapshot
    const previousRes = await db.prepare(
      'SELECT player_name, rank, rating, country_code FROM ranking_snapshots WHERE snapshot_date = ? AND ranking_type = ?'
    ).bind(previousDate, type).all();

    // Build previous lookup
    const prevMap: Record<string, { rank: number; rating: number }> = {};
    for (const p of (previousRes.results || []) as any[]) {
      prevMap[p.player_name] = { rank: p.rank, rating: p.rating };
    }

    // Compute changes
    const changes: any[] = [];
    for (const p of (currentRes.results || []) as any[]) {
      const prev = prevMap[p.player_name];
      if (prev) {
        changes.push({
          name: p.player_name,
          country_code: p.country_code,
          current_rating: p.rating,
          previous_rating: prev.rating,
          rating_change: p.rating - prev.rating,
          current_rank: p.rank,
          previous_rank: prev.rank,
          rank_change: prev.rank - p.rank, // positive = moved up
        });
      }
    }

    // Sort for risers (highest positive rating change)
    const risers = [...changes]
      .filter(c => c.rating_change > 0)
      .sort((a, b) => b.rating_change - a.rating_change)
      .slice(0, limit);

    // Sort for fallers (biggest negative rating change)
    const fallers = [...changes]
      .filter(c => c.rating_change < 0)
      .sort((a, b) => a.rating_change - b.rating_change)
      .slice(0, limit);

    return new Response(JSON.stringify({
      type,
      period,
      current_date: currentDate,
      previous_date: previousDate,
      risers,
      fallers,
      total_players: changes.length,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to compute movers' }), { status: 500, headers });
  }
};
