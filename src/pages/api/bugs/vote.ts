import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/bugs/vote — increment/decrement the vote count for a bug
 * Body: { id: string, direction?: 'up' | 'down' }
 */

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, direction } = body;
  if (!id || typeof id !== 'string') {
    return new Response(JSON.stringify({ error: 'Bug ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const delta = direction === 'down' ? -1 : 1;

  const result = await db.prepare(
    'UPDATE bugs SET votes = MAX(0, votes + ?) WHERE id = ?'
  ).bind(delta, id).run();

  if (!result.meta.changes) {
    return new Response(JSON.stringify({ error: 'Bug not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bug = await db.prepare('SELECT votes FROM bugs WHERE id = ?').bind(id).first();

  return new Response(JSON.stringify({ success: true, votes: bug?.votes ?? 0 }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
