import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/tournaments/ — Tournament Calendar (public, read-only)
 *
 * Query params:
 *   ?status=upcoming (default) | active | completed | all
 *   ?limit=20 (default, max 50)
 *
 * Returns: { tournaments: [...], total, source }
 * Cached for 30 minutes.
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  try {
    const status = url.searchParams.get('status') || 'upcoming';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

    let query: string;
    let params: any[] = [];

    if (status === 'all') {
      query = 'SELECT name, location, country, start_date, end_date, tier, status, wespa_rated, winner, participants FROM tournaments ORDER BY start_date DESC LIMIT ?';
      params = [limit];
    } else {
      query = 'SELECT name, location, country, start_date, end_date, tier, status, wespa_rated, winner, participants FROM tournaments WHERE status = ? ORDER BY start_date ASC LIMIT ?';
      params = [status, limit];
    }

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      tournaments: results,
      total: results.length,
      source: 'ScrabbleWordsFinder.com',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
