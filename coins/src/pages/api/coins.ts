import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const showAll = url.searchParams.get('all') === 'true';

  const query = `
    SELECT c.*, t.mktcap, t.price_5m, t.price_1h, t.price_6h, t.price_24h, t.fdv, t.liquidity, t.volume, t.price_usd
    FROM coins c
    LEFT JOIN (
      SELECT t1.* FROM tracker t1
      INNER JOIN (SELECT coinid, MAX(id) as max_id FROM tracker GROUP BY coinid) t2
      ON t1.id = t2.max_id
    ) t ON c.coinid = t.coinid
    ${showAll ? '' : "WHERE c.enabled = 'yes'"}
    ORDER BY c.coinid DESC
  `;

  const { results } = await db.prepare(query).all();
  return new Response(JSON.stringify({ coins: results }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { coinname, ca, dexscreenerurl, enabled, currentstatus, expert_comment, trend, narrative, icon_url, user_id } = body;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const result = await db.prepare(
    `INSERT INTO coins (coinname, ca, dexscreenerurl, enabled, currentstatus, expert_comment, trend, narrative, icon_url, user_id, createdon, datecreated, datemodified)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    user_id || '',
    now, now, now
  ).run();

  return new Response(JSON.stringify({ success: true, coinid: result.meta.last_row_id }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { coinid, coinname, ca, dexscreenerurl, enabled, currentstatus, expert_comment, trend, narrative, icon_url, safety } = body;

  if (!coinid) return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  // Build dynamic update — only update fields that were provided
  const fields: string[] = [];
  const values: any[] = [];

  if (coinname !== undefined) { fields.push('coinname = ?'); values.push(coinname || ''); }
  if (ca !== undefined) { fields.push('ca = ?'); values.push(ca || ''); }
  if (dexscreenerurl !== undefined) { fields.push('dexscreenerurl = ?'); values.push(dexscreenerurl || ''); }
  if (enabled !== undefined) { fields.push('enabled = ?'); values.push(enabled); }
  if (currentstatus !== undefined) { fields.push('currentstatus = ?'); values.push(currentstatus || ''); }
  if (expert_comment !== undefined) { fields.push('expert_comment = ?'); values.push(expert_comment || ''); }
  if (trend !== undefined) { fields.push('trend = ?'); values.push(trend || ''); }
  if (narrative !== undefined) { fields.push('narrative = ?'); values.push(narrative || ''); }
  if (icon_url !== undefined) { fields.push('icon_url = ?'); values.push(icon_url || ''); }
  if (safety !== undefined) { fields.push('safety = ?'); values.push(safety || ''); }
  fields.push('datemodified = ?'); values.push(now);
  values.push(coinid);

  await db.prepare(`UPDATE coins SET ${fields.join(', ')} WHERE coinid = ?`).bind(...values).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const coinid = url.searchParams.get('coinid');

  if (!coinid) return new Response(JSON.stringify({ error: 'coinid required' }), { status: 400 });

  await db.prepare('DELETE FROM tracker WHERE coinid = ?').bind(Number(coinid)).run();
  await db.prepare('DELETE FROM coins WHERE coinid = ?').bind(Number(coinid)).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
