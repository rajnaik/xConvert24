/**
 * Public API: /api/public/country/[code]/
 * Returns all players for a specific country code.
 * Example: /api/public/country/ng/ → all Nigerian players
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const code = (params.code || '').toUpperCase();

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  if (!code || code.length < 2 || code.length > 3) {
    return new Response(JSON.stringify({ error: 'Invalid country code' }), { status: 400, headers });
  }

  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers });
    }

    const res = await db.prepare(
      "SELECT name, country, country_code, rating, rank, titles, ranking_type FROM player_rankings WHERE UPPER(country_code) = ? AND ranking_type = 'wespa' AND active = 1 ORDER BY rank ASC"
    ).bind(code).all();

    const players = (res.results || []) as any[];

    if (players.length === 0) {
      return new Response(JSON.stringify({ error: 'No players found for this country', country_code: code }), { status: 404, headers });
    }

    const countryName = players[0].country || code;
    const avgRating = Math.round(players.reduce((sum: number, p: any) => sum + p.rating, 0) / players.length);
    const titledPlayers = players.filter((p: any) => p.titles && p.titles.length > 3);

    return new Response(JSON.stringify({
      country_code: code,
      country_name: countryName,
      total_players: players.length,
      avg_rating: avgRating,
      top_player: players[0].name,
      top_rating: players[0].rating,
      titled_players: titledPlayers.length,
      players: players.map((p: any) => ({
        name: p.name,
        rating: p.rating,
        rank: p.rank,
        titles: p.titles || '',
      })),
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch country data' }), { status: 500, headers });
  }
};
