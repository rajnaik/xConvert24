/**
 * Public API: /api/public/tournament-results/
 * Returns detailed results for a specific tournament.
 * Query params:
 *   ?id=1 (required — tournament ID)
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  if (!id) {
    return new Response(JSON.stringify({ error: 'Tournament id required (?id=N)' }), { status: 400, headers });
  }

  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers });
    }

    // Get tournament info
    const tournament = await db.prepare(
      'SELECT * FROM tournaments WHERE id = ?'
    ).bind(parseInt(id)).first();

    if (!tournament) {
      return new Response(JSON.stringify({ error: 'Tournament not found' }), { status: 404, headers });
    }

    // Get results
    const results = await db.prepare(
      'SELECT * FROM tournament_results WHERE tournament_id = ? ORDER BY position ASC'
    ).bind(parseInt(id)).all();

    return new Response(JSON.stringify({
      tournament,
      results: results.results || [],
      total_players: (results.results || []).length,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tournament results' }), { status: 500, headers });
  }
};
