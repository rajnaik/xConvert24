import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/player/?name=David Eldar — Player Profile API (public, read-only)
 * GET /api/public/player/?id=1 — by ID
 *
 * Returns player profile with all ranking data across types.
 * Cached for 30 minutes.
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  const id = url.searchParams.get('id');
  const name = url.searchParams.get('name');

  if (!id && !name) {
    return jsonError('Either ?id= or ?name= is required', 400);
  }

  try {
    let player: any = null;

    if (id) {
      player = await db.prepare('SELECT * FROM player_rankings WHERE id = ? AND active = 1').bind(parseInt(id)).first();
    } else if (name) {
      // Fuzzy match — case insensitive, partial match
      const { results } = await db.prepare(
        "SELECT * FROM player_rankings WHERE LOWER(name) LIKE ? AND active = 1 ORDER BY ranking_type, rank"
      ).bind(`%${name.toLowerCase()}%`).all();

      if (results && results.length > 0) {
        // Group by player name (might have entries in wespa + ytd + online)
        const playerName = results[0].name;
        const allEntries = results.filter((r: any) => r.name.toLowerCase() === playerName.toLowerCase());

        return new Response(JSON.stringify({
          player: {
            name: playerName,
            country: allEntries[0].country,
            country_code: allEntries[0].country_code,
            rankings: allEntries.map((r: any) => ({
              type: r.ranking_type,
              rank: r.rank,
              rating: r.rating,
              games_played: r.games_played,
              peak_rating: r.peak_rating,
              titles: r.titles || '',
              last_played: r.last_played || '',
            })),
          },
          source: 'ScrabbleWordsFinder.com',
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=1800',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return jsonError('Player not found', 404);
    }

    if (!player) return jsonError('Player not found', 404);

    // Get all rankings for this player across types
    const { results } = await db.prepare(
      "SELECT * FROM player_rankings WHERE LOWER(name) = LOWER(?) AND active = 1"
    ).bind(player.name).all();

    return new Response(JSON.stringify({
      player: {
        name: player.name,
        country: player.country,
        country_code: player.country_code,
        rankings: (results || []).map((r: any) => ({
          type: r.ranking_type,
          rank: r.rank,
          rating: r.rating,
          games_played: r.games_played,
          peak_rating: r.peak_rating,
          titles: r.titles || '',
          last_played: r.last_played || '',
        })),
      },
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
