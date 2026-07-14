import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/rankings/ — World Scrabble Rankings (public, read-only)
 *
 * Query params:
 *   ?type=wespa (default) | ytd | online
 *   ?limit=50 (default, max 100)
 *
 * Returns: { rankings: [...], type, total, source }
 * Cached for 30 minutes.
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  try {
    const type = url.searchParams.get('type') || 'wespa';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);

    if (!['wespa', 'ytd', 'online'].includes(type)) {
      return jsonError('Invalid type. Use: wespa, ytd, online', 400);
    }

    const { results } = await db.prepare(
      'SELECT rank, name, country, country_code, rating, games_played, peak_rating, titles, last_played FROM player_rankings WHERE ranking_type = ? AND active = 1 ORDER BY rank ASC LIMIT ?'
    ).bind(type, limit).all();

    return new Response(JSON.stringify({
      rankings: results,
      type,
      total: results.length,
      source: 'ScrabbleWordsFinder.com',
      attribution: 'Data sourced from publicly available WESPA tournament results.',
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
