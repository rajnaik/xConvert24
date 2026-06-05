import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/test-runs — list all test runs (latest first, max 50)
 * POST /api/test-runs — log a new test run
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT * FROM test_runs ORDER BY timestamp DESC LIMIT 50'
  ).all();

  // Parse tests_json for each result
  const runs = results.map((r: any) => ({
    ...r,
    tests: JSON.parse(r.tests_json || '[]'),
  }));

  return new Response(JSON.stringify({ runs }), {
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

  const { version, total, passed, failed, skipped, duration, tests } = body;

  if (!version) {
    return new Response(JSON.stringify({ error: 'version is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT INTO test_runs (version, total, passed, failed, skipped, duration, tests_json) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    version,
    total || 0,
    passed || 0,
    failed || 0,
    skipped || 0,
    duration || '',
    JSON.stringify(tests || [])
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
