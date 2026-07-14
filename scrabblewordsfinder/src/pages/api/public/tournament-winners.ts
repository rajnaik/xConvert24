/**
 * Public API: /api/public/tournament-winners/
 * Returns tournament winners history.
 * Query params:
 *   ?tournament=WSC|WESPAC|NSC|Causeway|WYSC|JWSC|WorldCup (optional, all if omitted)
 *   ?winner=name (optional, filter by winner name)
 *   ?limit=N (optional, default all)
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const tournament = url.searchParams.get('tournament');
  const winner = url.searchParams.get('winner');
  const limit = parseInt(url.searchParams.get('limit') || '0') || 0;

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

    let query = 'SELECT tournament, year, winner_name, winner_country, winner_country_code, runner_up, runner_up_country, location, division, notes FROM tournament_winners';
    const conditions: string[] = [];
    const binds: any[] = [];

    if (tournament) {
      conditions.push('tournament = ?');
      binds.push(tournament);
    }
    if (winner) {
      conditions.push('winner_name LIKE ?');
      binds.push(`%${winner}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY year DESC';

    if (limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    const stmt = binds.length > 0
      ? db.prepare(query).bind(...binds)
      : db.prepare(query);

    const res = await stmt.all();
    const results = (res.results || []) as any[];

    // Group by tournament for cleaner output
    const grouped: Record<string, any[]> = {};
    for (const r of results) {
      if (!grouped[r.tournament]) grouped[r.tournament] = [];
      grouped[r.tournament].push({
        year: r.year,
        winner: r.winner_name,
        country: r.winner_country,
        country_code: r.winner_country_code,
        runner_up: r.runner_up || undefined,
        runner_up_country: r.runner_up_country || undefined,
        location: r.location,
        division: r.division,
        notes: r.notes || undefined,
      });
    }

    return new Response(JSON.stringify({
      total: results.length,
      tournaments: Object.keys(grouped).length,
      filters: { tournament: tournament || 'all', winner: winner || undefined },
      results: tournament ? (grouped[tournament] || []) : grouped,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tournament winners' }), { status: 500, headers });
  }
};
