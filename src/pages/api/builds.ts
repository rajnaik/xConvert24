import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/builds — list all builds (latest first, max 50)
 * POST /api/builds — log a new build event
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT * FROM builds ORDER BY timestamp DESC LIMIT 50'
  ).all();

  return new Response(JSON.stringify({ builds: results }), {
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

  const { version, status, duration, bundle_size, pages, assets, worker_version_id, notes } = body;

  if (!version) {
    return new Response(JSON.stringify({ error: 'version is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT INTO builds (version, status, duration, bundle_size, pages, assets, worker_version_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    version,
    status || 'success',
    duration || '',
    bundle_size || '',
    pages || 0,
    assets || 0,
    worker_version_id || '',
    notes || ''
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
