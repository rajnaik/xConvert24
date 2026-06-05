import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/suggestions — list all suggestions sorted by rating desc
 * POST /api/suggestions — submit a new suggestion
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT id, title, description, category, COALESCE(votes_count, 0) as votes_count, COALESCE(votes_total, 0) as votes_total, CASE WHEN COALESCE(votes_count, 0) > 0 THEN CAST(votes_total AS REAL) / votes_count ELSE 0 END as rating, created_at FROM suggestions ORDER BY rating DESC, created_at DESC'
  ).all();

  return new Response(JSON.stringify({ suggestions: results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

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

  const { title, description, category } = body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Title is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  await db.prepare(
    'INSERT INTO suggestions (id, title, description, category) VALUES (?, ?, ?, ?)'
  ).bind(id, title.trim(), (description || '').trim(), (category || '').trim()).run();

  return new Response(JSON.stringify({ success: true, id }), {
    status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
