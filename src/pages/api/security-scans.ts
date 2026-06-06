import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/security-scans — list last 10 security scans (most recent first)
 * POST /api/security-scans — log a new security scan result
 *   Body: { files_scanned, issues_found, severity_breakdown, status }
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Create table if not exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS security_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT (datetime('now')),
        files_scanned INTEGER DEFAULT 0,
        issues_found INTEGER DEFAULT 0,
        critical INTEGER DEFAULT 0,
        high INTEGER DEFAULT 0,
        medium INTEGER DEFAULT 0,
        low INTEGER DEFAULT 0,
        status TEXT DEFAULT 'completed',
        details TEXT
      )
    `).run();

    const { results } = await db.prepare(
      'SELECT * FROM security_scans ORDER BY timestamp DESC LIMIT 10'
    ).all();

    return new Response(JSON.stringify({ scans: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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

  const { files_scanned, issues_found, severity_breakdown, status, details } = body;

  try {
    // Create table if not exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS security_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT (datetime('now')),
        files_scanned INTEGER DEFAULT 0,
        issues_found INTEGER DEFAULT 0,
        critical INTEGER DEFAULT 0,
        high INTEGER DEFAULT 0,
        medium INTEGER DEFAULT 0,
        low INTEGER DEFAULT 0,
        status TEXT DEFAULT 'completed',
        details TEXT
      )
    `).run();

    const critical = severity_breakdown?.critical || 0;
    const high = severity_breakdown?.high || 0;
    const medium = severity_breakdown?.medium || 0;
    const low = severity_breakdown?.low || 0;

    const result = await db.prepare(
      `INSERT INTO security_scans (files_scanned, issues_found, critical, high, medium, low, status, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      files_scanned || 0,
      issues_found || 0,
      critical,
      high,
      medium,
      low,
      status || 'completed',
      details ? JSON.stringify(details) : null
    ).run();

    return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
