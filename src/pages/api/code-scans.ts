import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/code-scans — list code scans (latest first, max 50)
 * POST /api/code-scans — log a new code scan result
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = parseInt(url.searchParams.get('limit') || '50');
  const order = url.searchParams.get('order') === 'asc' ? 'ASC' : 'DESC';

  const { results } = await db.prepare(
    `SELECT * FROM code_scans ORDER BY timestamp ${order} LIMIT ?`
  ).bind(limit).all();

  return new Response(JSON.stringify({ scans: results }), {
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

  const { version, status, bugs, vulnerabilities, code_smells, coverage, duplications, duration, branch, commit_hash, scanner, summary } = body;

  if (!version) {
    return new Response(JSON.stringify({ error: 'version is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT INTO code_scans (version, status, bugs, vulnerabilities, code_smells, coverage, duplications, duration, branch, commit_hash, scanner, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    version,
    status || 'passed',
    bugs || 0,
    vulnerabilities || 0,
    code_smells || 0,
    coverage || '',
    duplications || '',
    duration || '',
    branch || '',
    commit_hash || '',
    scanner || 'sonarqube',
    summary || ''
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
