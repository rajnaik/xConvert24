import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const countOnly = url.searchParams.get('count');
  if (countOnly) {
    const total = await db.prepare('SELECT COUNT(*) as count FROM campaign_recipients').first();
    const unsubs = await db.prepare("SELECT COUNT(*) as count FROM campaign_recipients WHERE status = 'unsubscribed'").first();
    const sent = await db.prepare("SELECT COUNT(*) as count FROM campaign_recipients WHERE status = 'sent'").first();
    const pending = await db.prepare("SELECT COUNT(*) as count FROM campaign_recipients WHERE status = 'pending'").first();
    return new Response(JSON.stringify({ total: total?.count || 0, unsubscribed: unsubs?.count || 0, sent: sent?.count || 0, pending: pending?.count || 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  const { results } = await db.prepare('SELECT * FROM campaign_recipients ORDER BY created_at DESC LIMIT 200').all();
  return new Response(JSON.stringify({ recipients: results }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { email, name, company, website, campaign_name } = body;

  if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  // Check global unsubscribe list
  const unsub = await db.prepare('SELECT id FROM campaign_unsubscribes WHERE email = ?').bind(email).first();
  if (unsub) {
    return new Response(JSON.stringify({ error: 'Email is on the unsubscribe list' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
  }

  // Generate unique unsubscribe token
  const token = crypto.randomUUID().replace(/-/g, '');

  try {
    await db.prepare(
      `INSERT INTO campaign_recipients (email, name, company, website, unsubscribe_token, campaign_name) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(email, name || '', company || '', website || '', token, campaign_name || 'default').run();

    return new Response(JSON.stringify({ success: true, token }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: 'Email already exists in campaign' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id, status, notes } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const updates: string[] = [];
  const values: any[] = [];

  if (status !== undefined) {
    updates.push('status = ?'); values.push(status);
    if (status === 'sent') { updates.push("sent_at = datetime('now')"); }
  }
  if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

  if (!updates.length) return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  values.push(id);
  await db.prepare(`UPDATE campaign_recipients SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json() as any;
  const { id } = body;
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  await db.prepare('DELETE FROM campaign_recipients WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
