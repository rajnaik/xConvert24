import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/diamond-hunt/ — list all diamond hunts with claim counts
export const GET: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const id = url.searchParams.get('id');

  if (id) {
    // Single diamond with its claims
    const diamond = await db.prepare('SELECT * FROM diamond_hunt WHERE id = ?').bind(id).first();
    if (!diamond) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    const claims = await db.prepare('SELECT * FROM diamond_claims WHERE diamond_id = ? ORDER BY claimed_at DESC').bind(id).all();
    return new Response(JSON.stringify({ diamond, claims: claims.results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const diamonds = await db.prepare(
    `SELECT dh.*, (SELECT COUNT(*) FROM diamond_claims dc WHERE dc.diamond_id = dh.id) as claim_count
     FROM diamond_hunt dh ORDER BY dh.id DESC`
  ).all();

  const totalClaims = await db.prepare('SELECT COUNT(*) as count FROM diamond_claims').first() as any;

  return new Response(JSON.stringify({
    diamonds: diamonds.results,
    summary: {
      total: diamonds.results.length,
      active: diamonds.results.filter((d: any) => d.status === 'active').length,
      inactive: diamonds.results.filter((d: any) => d.status === 'inactive').length,
      totalClaims: totalClaims?.count || 0,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/diamond-hunt/ — create a new diamond hunt
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { diamonds_remaining, diamonds_per_claim, status, end_date, dom_loc } = body;

  if (!dom_loc) return new Response(JSON.stringify({ error: 'dom_loc is required' }), { status: 400 });

  const result = await db.prepare(
    `INSERT INTO diamond_hunt (diamonds_remaining, diamonds_per_claim, status, end_date, dom_loc)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    diamonds_remaining || 10,
    diamonds_per_claim || 1,
    status || 'active',
    end_date || null,
    dom_loc
  ).run();

  return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT /api/diamond-hunt/ — update a diamond hunt
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { id, diamonds_remaining, diamonds_per_claim, status, end_date, dom_loc } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });

  await db.prepare(
    `UPDATE diamond_hunt SET diamonds_remaining = ?, diamonds_per_claim = ?, status = ?, end_date = ?, dom_loc = ? WHERE id = ?`
  ).bind(
    diamonds_remaining ?? 10,
    diamonds_per_claim ?? 1,
    status || 'active',
    end_date || null,
    dom_loc || '',
    id
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE /api/diamond-hunt/?id=X — delete a diamond hunt and its claims
export const DELETE: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM diamond_claims WHERE diamond_id = ?').bind(id).run();
  await db.prepare('DELETE FROM diamond_hunt WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
