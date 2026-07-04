import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/campaign-leads/ — CRUD for campaign_leads table
 * GET    ?set=&sent=&limit=  — list leads
 * POST   { school_name, email, contact_person, role, town, campaign_email_set } — create lead
 * PUT    { id, ...fields } — update lead
 * DELETE { id } — delete lead
 */

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 10000);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const set = url.searchParams.get('set');
  const sent = url.searchParams.get('sent');
  const id = url.searchParams.get('id');

  // Single record by ID
  if (id) {
    try {
      const row = await db.prepare('SELECT * FROM campaign_leads WHERE id = ?').bind(parseInt(id)).first();
      if (!row) return json({ error: 'Not found' }, 404);
      return json({ lead: row });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  let query = 'SELECT * FROM campaign_leads';
  let countQuery = 'SELECT COUNT(*) as total FROM campaign_leads';
  const conditions: string[] = [];
  const params: any[] = [];

  if (set) { conditions.push('campaign_email_set = ?'); params.push(parseInt(set)); }
  if (sent === '0' || sent === '1') { conditions.push('sent = ?'); params.push(parseInt(sent)); }
  const batch = url.searchParams.get('batch');
  if (batch) { conditions.push('batch = ?'); params.push(batch); }

  if (conditions.length) {
    const where = ' WHERE ' + conditions.join(' AND ');
    query += where;
    countQuery += where;
  }
  query += ' ORDER BY id ASC LIMIT ? OFFSET ?';

  try {
    const stmts = [
      db.prepare(query).bind(...params, limit, offset),
      db.prepare(countQuery).bind(...params),
    ];
    const [dataResult, countResult] = await db.batch(stmts);
    const results = dataResult.results || [];
    const total = countResult.results?.[0]?.total || 0;

    // Get global sent count (across all records, ignoring filters)
    const globalStats = await db.prepare("SELECT COUNT(*) as total, SUM(sent) as sent_count FROM campaign_leads").first();
    const globalTotal = globalStats?.total || 0;
    const globalSent = globalStats?.sent_count || 0;

    // Get all distinct batch names with stats for the filter dropdown
    const batchResult = await db.prepare("SELECT batch, COUNT(*) as total, SUM(sent) as sent_count FROM campaign_leads WHERE batch != '' GROUP BY batch ORDER BY CAST(SUBSTR(batch, 6) AS INTEGER)").all();
    const batches = (batchResult.results || []).map((r: any) => ({ name: r.batch, total: r.total, sent: r.sent_count }));

    return json({ leads: results, total, sent_count: globalSent, global_total: globalTotal, limit, offset, batches });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  try {
    const body = await request.json();
    const { school_name, email, contact_person = '', role = 'Headteacher', town = '', campaign_email_set = 1 } = body;

    if (!school_name || !email) return json({ error: 'school_name and email are required' }, 400);

    const result = await db.prepare(
      'INSERT INTO campaign_leads (school_name, email, contact_person, role, town, campaign_email_set) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(school_name, email, contact_person, role, town, campaign_email_set).run();

    return json({ success: true, id: result.meta?.last_row_id });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  try {
    const body = await request.json();

    // Bulk batch update: { batch_update: true, batch: 'Batch1', sent: 1 }
    if (body.batch_update && body.batch) {
      const sent = body.sent ? 1 : 0;
      const sentAt = sent ? new Date().toISOString().split('T')[0] : null;
      await db.prepare('UPDATE campaign_leads SET sent = ?, sent_at = ? WHERE batch = ?')
        .bind(sent, sentAt, body.batch).run();
      return json({ success: true, batch: body.batch, sent });
    }

    const { id, ...fields } = body;
    if (!id) return json({ error: 'id is required' }, 400);

    const allowed = ['school_name', 'email', 'contact_person', 'role', 'town', 'campaign_email_set', 'sent', 'sent_at', 'response', 'batch'];
    const updates: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (!updates.length) return json({ error: 'No valid fields to update' }, 400);

    values.push(id);
    await db.prepare(`UPDATE campaign_leads SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

    const updated = await db.prepare('SELECT * FROM campaign_leads WHERE id = ?').bind(id).first();
    return json({ success: true, lead: updated });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not configured' }, 500);

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return json({ error: 'id is required' }, 400);

    await db.prepare('DELETE FROM campaign_leads WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
};
