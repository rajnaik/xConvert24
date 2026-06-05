import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/code-reviews — list code reviews (latest first, max 50)
 * POST /api/code-reviews — log a new code review result
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = parseInt(url.searchParams.get('limit') || '50');

  const { results } = await db.prepare(
    'SELECT * FROM code_reviews ORDER BY timestamp DESC LIMIT ?'
  ).bind(limit).all();

  return new Response(JSON.stringify({ reviews: results }), {
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

  const { version, status, issues_found, issues_critical, issues_major, issues_minor, duration, reviewer, branch, commit_hash, summary } = body;

  if (!version) {
    return new Response(JSON.stringify({ error: 'version is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT INTO code_reviews (version, status, issues_found, issues_critical, issues_major, issues_minor, duration, reviewer, branch, commit_hash, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    version,
    status || 'passed',
    issues_found || 0,
    issues_critical || 0,
    issues_major || 0,
    issues_minor || 0,
    duration || '',
    reviewer || 'sonarqube',
    branch || '',
    commit_hash || '',
    summary || ''
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
