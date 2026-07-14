/**
 * Public API: /api/public/countries/
 * Returns country-level aggregate statistics from current rankings.
 * Query params:
 *   ?type=wespa (default) | ytd | online
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'wespa';

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

    // Compute live country stats from player_rankings
    const rankings = await db.prepare(
      'SELECT name, country, country_code, rating, titles FROM player_rankings WHERE ranking_type = ? AND active = 1 ORDER BY rating DESC'
    ).bind(type).all();

    const players = (rankings.results || []) as any[];
    if (players.length === 0) {
      return new Response(JSON.stringify({ type, countries: [], total_players: 0 }), { status: 200, headers });
    }

    // Aggregate by country
    const countryMap: Record<string, {
      country_code: string;
      country_name: string;
      players: number;
      total_rating: number;
      top_player: string;
      top_rating: number;
      titled_players: number;
    }> = {};

    for (const p of players) {
      const code = p.country_code || 'XX';
      const name = p.country || code;
      if (!countryMap[code]) {
        countryMap[code] = {
          country_code: code,
          country_name: name,
          players: 0,
          total_rating: 0,
          top_player: p.name,
          top_rating: p.rating,
          titled_players: 0,
        };
      }
      countryMap[code].players++;
      countryMap[code].total_rating += p.rating;
      if (p.titles && p.titles.length > 3) {
        countryMap[code].titled_players++;
      }
    }

    // Build sorted result
    const countries = Object.values(countryMap)
      .map(c => ({
        country_code: c.country_code,
        country_name: c.country_name,
        total_players: c.players,
        avg_rating: Math.round(c.total_rating / c.players),
        top_player: c.top_player,
        top_rating: c.top_rating,
        titled_players: c.titled_players,
        representation: Math.round((c.players / players.length) * 100),
      }))
      .sort((a, b) => b.total_players - a.total_players);

    return new Response(JSON.stringify({
      type,
      total_players: players.length,
      total_countries: countries.length,
      countries,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to compute country stats' }), { status: 500, headers });
  }
};
