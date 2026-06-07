import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/auditlog — List audit log entries (optional ?command= filter, default last 10)
 * POST /api/auditlog — Log a command execution
 *   Body: { command: string, status: 0|1, details?: string }
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const command = url.searchParams.get('command');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10') || 10, 50);

  let query: string;
  let params: any[];

  if (command) {
    query = 'SELECT id, command, status, details, created_at FROM AuditLog WHERE command = ? ORDER BY created_at DESC LIMIT ?';
    params = [command, limit];
  } else {
    query = 'SELECT id, command, status, details, created_at FROM AuditLog ORDER BY created_at DESC LIMIT ?';
    params = [limit];
  }

  const { results } = await db.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({ logs: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { command, status, details } = body;
  if (!command || (status !== 0 && status !== 1)) {
    return new Response(JSON.stringify({ error: 'command (string) and status (0 or 1) are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare('INSERT INTO AuditLog (command, status, details) VALUES (?, ?, ?)')
    .bind(command, status, String(details || '')).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
