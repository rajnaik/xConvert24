/**
 * Public API: /api/public/players/search/
 * Real-time player search/autocomplete across all active players.
 * Query params:
 *   ?q= (required) search query (min 2 chars)
 *   ?type=wespa (default) | ytd | online | all
 *   ?limit=10 (default, max 20)
 *
 * Returns matching players sorted by rank (best first).
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const type = url.searchParams.get('type') || 'wespa';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10') || 10, 20);

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60',
  };

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ error: 'Query ?q= must be at least 2 characters', results: [] }), { status: 400, headers });
  }

  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 503, headers });
    }

    let results: any[];

    if (type === 'all') {
      const res = await db.prepare(
        "SELECT name, country, country_code, rating, rank, ranking_type FROM player_rankings WHERE LOWER(name) LIKE ? AND active = 1 ORDER BY rank ASC LIMIT ?"
      ).bind(`%${q.toLowerCase()}%`, limit).all();
      results = res.results || [];
    } else {
      const res = await db.prepare(
        "SELECT name, country, country_code, rating, rank, ranking_type FROM player_rankings WHERE LOWER(name) LIKE ? AND ranking_type = ? AND active = 1 ORDER BY rank ASC LIMIT ?"
      ).bind(`%${q.toLowerCase()}%`, type, limit).all();
      results = res.results || [];
    }

    const players = results.map((p: any) => ({
      name: p.name,
      country: p.country,
      country_code: p.country_code,
      rating: p.rating,
      rank: p.rank,
      ranking_type: p.ranking_type,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));

    return new Response(JSON.stringify({
      query: q,
      type,
      total: players.length,
      results: players,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500, headers });
  }
};
