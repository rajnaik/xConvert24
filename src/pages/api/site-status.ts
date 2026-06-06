import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/site-status — get current site status (golden/green/red)
 * POST /api/site-status — update site status
 *   Body: { status: 'golden' | 'green' | 'red', updated_by?: string }
 */

const VALID_STATUSES = ['golden', 'green', 'red'];

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ status: 'golden', updated_at: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const row = await db.prepare('SELECT * FROM site_status WHERE id = 1').first();
  return new Response(JSON.stringify(row || { status: 'golden', updated_at: null }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
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

  const { status, updated_by } = body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid status. Must be: golden, green, or red' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, ?, datetime("now"), ?)'
  ).bind(status, updated_by || 'system').run();

  return new Response(JSON.stringify({ success: true, status }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
