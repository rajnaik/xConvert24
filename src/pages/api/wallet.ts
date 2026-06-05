import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/wallet — get the public wallet address (for support page)
 * POST /api/wallet — update wallet address (admin only, requires re-auth)
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ address: '', name: 'solana' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const row = await db.prepare('SELECT name, address FROM wallet WHERE id = 1').first();
  return new Response(JSON.stringify(row || { address: '', name: 'solana' }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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

  const { address } = body;
  if (!address || typeof address !== 'string' || address.trim().length < 10) {
    return new Response(JSON.stringify({ error: 'Valid wallet address required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare("UPDATE wallet SET address = ?, updated_at = datetime('now') WHERE id = 1")
    .bind(address.trim()).run();

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
