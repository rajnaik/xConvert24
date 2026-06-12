import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const url = new URL(request.url);
  const coinid = url.searchParams.get('coinid');

  if (coinid) {
    const { results } = await db.prepare('SELECT * FROM tracker WHERE coinid = ? ORDER BY tracked_at DESC').bind(Number(coinid)).all();
    return new Response(JSON.stringify({ tracker: results }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { results } = await db.prepare('SELECT * FROM tracker ORDER BY tracked_at DESC').all();
  return new Response(JSON.stringify({ tracker: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const body = await request.json();
  const { coinid, dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders } = body;

  if (!coinid) return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });

  const result = await db.prepare(
    `INSERT INTO tracker (coinid, dexscreenerurl, fdv, liquidity, mktcap, price_5m, price_1h, price_6h, price_24h, txns, volume, traders, holders)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(coinid, dexscreenerurl || '', fdv || '', liquidity || '', mktcap || '', price_5m || '', price_1h || '', price_6h || '', price_24h || '', txns || '', volume || '', traders || '', holders || '').run();

  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM tracker WHERE id = ?').bind(Number(id)).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
