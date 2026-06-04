import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/bugs — list all bugs sorted by votes desc
 * POST /api/bugs — submit a new bug report
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT id, page, href, severity, description, email, votes, created_at FROM bugs ORDER BY votes DESC, created_at DESC'
  ).all();

  return new Response(JSON.stringify({ bugs: results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

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

  const { page, href, severity, description, email } = body;
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Description is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const validSeverity = ['low', 'medium', 'high'].includes(severity) ? severity : 'low';

  await db.prepare(
    'INSERT INTO bugs (id, page, href, severity, description, email) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, page || '', href || '', validSeverity, description.trim(), email || '').run();

  return new Response(JSON.stringify({ success: true, id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
