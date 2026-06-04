import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/suggestions/rate — rate a suggestion (1-5 stars)
 * Body: { id: string, stars: number (1-5) }
 */

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, stars } = body;
  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'Suggestion ID is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const rating = Math.min(5, Math.max(1, Math.round(Number(stars) || 0)));

  // Update votes_count, votes_total, recalculate rating
  const result = await db.prepare(
    'UPDATE suggestions SET votes_count = votes_count + 1, votes_total = votes_total + ?, rating = CAST((votes_total + ?) AS REAL) / (votes_count + 1) WHERE id = ?'
  ).bind(rating, rating, id).run();

  if (!result.meta.changes) {
    return new Response(JSON.stringify({ error: 'Suggestion not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  const row = await db.prepare('SELECT rating, votes_count FROM suggestions WHERE id = ?').bind(id).first();

  return new Response(JSON.stringify({ success: true, rating: row?.rating ?? 0, votes_count: row?.votes_count ?? 0 }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
