import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/test-emails?id={uniqueId} — Check if a test email was received
 * POST /api/test-emails — Store a received test email (called by Email Worker)
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  const uniqueId = url.searchParams.get('id');
  if (!uniqueId) return json({ error: 'id parameter required' }, 400);

  try {
    const row = await db.prepare(
      'SELECT * FROM test_emails WHERE unique_id = ? ORDER BY received_at DESC LIMIT 1'
    ).bind(uniqueId).first();

    if (row) {
      return json({ found: true, email: row });
    }
    return json({ found: false });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { unique_id, from_address, to_address, subject, body: emailBody } = body;
  if (!unique_id) return json({ error: 'unique_id required' }, 400);

  try {
    await db.prepare(
      'INSERT INTO test_emails (unique_id, from_address, to_address, subject, body) VALUES (?, ?, ?, ?, ?)'
    ).bind(unique_id, from_address || '', to_address || '', subject || '', emailBody || '').run();

    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
