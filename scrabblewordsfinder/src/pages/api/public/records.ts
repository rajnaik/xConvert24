/**
 * Public API: /api/public/records/
 * Returns all active Scrabble records grouped by category.
 * Query params:
 *   ?category=rating|tournament|career|improvement (optional filter)
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '';

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

    const query = category
      ? 'SELECT * FROM scrabble_records WHERE active = 1 AND category = ? ORDER BY id ASC'
      : 'SELECT * FROM scrabble_records WHERE active = 1 ORDER BY category ASC, id ASC';

    const result = category
      ? await db.prepare(query).bind(category).all()
      : await db.prepare(query).all();

    const records = result.results || [];

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const r of records as any[]) {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    }

    return new Response(JSON.stringify({
      total: records.length,
      categories: Object.keys(grouped),
      records: grouped,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch records' }), { status: 500, headers });
  }
};
