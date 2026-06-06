import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/notify-copy — Log when someone copies the wallet address
 */
export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { address, timestamp } = body;

  if (db) {
    try {
      await db.prepare(
        `CREATE TABLE IF NOT EXISTS wallet_copy_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          address TEXT,
          copied_at TEXT DEFAULT (datetime('now'))
        )`
      ).run();

      await db.prepare(
        'INSERT INTO wallet_copy_events (address, copied_at) VALUES (?, ?)'
      ).bind(address || '', timestamp || new Date().toISOString()).run();
    } catch {}
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ events: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS wallet_copy_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT,
        copied_at TEXT DEFAULT (datetime('now'))
      )`
    ).run();

    const { results } = await db.prepare(
      'SELECT * FROM wallet_copy_events ORDER BY copied_at DESC LIMIT 20'
    ).all();

    return new Response(JSON.stringify({ events: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ events: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
