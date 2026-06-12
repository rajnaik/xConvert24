import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const { results } = await db.prepare('SELECT * FROM coins ORDER BY coinid DESC').all();
  return new Response(JSON.stringify({ coins: results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const body = await request.json();
  const { coinname, ca, dexscreenerurl, enabled, currentstatus, expert_comment, trend, narrative, icon_url } = body;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const result = await db.prepare(
    `INSERT INTO coins (coinname, ca, dexscreenerurl, enabled, currentstatus, expert_comment, trend, narrative, icon_url, createdon, datecreated, datemodified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    coinname || '',
    ca || '',
    dexscreenerurl || '',
    enabled || 'yes',
    currentstatus || '',
    expert_comment || '',
    trend || '',
    narrative || '',
    icon_url || '',
    now, now, now
  ).run();

  return new Response(JSON.stringify({ success: true, coinid: result.meta.last_row_id }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const body = await request.json();
  const { coinid, coinname, ca, dexscreenerurl, enabled, currentstatus, expert_comment, trend, narrative, icon_url } = body;

  if (!coinid) return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.prepare(
    `UPDATE coins SET coinname = ?, ca = ?, dexscreenerurl = ?, enabled = ?, currentstatus = ?, expert_comment = ?, trend = ?, narrative = ?, icon_url = ?, datemodified = ?
     WHERE coinid = ?`
  ).bind(coinname || '', ca || '', dexscreenerurl || '', enabled, currentstatus || '', expert_comment || '', trend || '', narrative || '', icon_url || '', now, coinid).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime.env.DB;
  const url = new URL(request.url);
  const coinid = url.searchParams.get('coinid');

  if (!coinid) return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });

  await db.prepare('DELETE FROM tracker WHERE coinid = ?').bind(Number(coinid)).run();
  await db.prepare('DELETE FROM coins WHERE coinid = ?').bind(Number(coinid)).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
