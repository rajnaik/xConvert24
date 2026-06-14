import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/toolset — CRUD for tech stack tracking
 *
 * GET  /api/toolset         → returns all tools
 * POST /api/toolset         → create a new tool entry
 * PUT  /api/toolset         → update an existing tool (requires id in body)
 * DELETE /api/toolset?id=N  → delete a tool entry
 */

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const { results } = await db.prepare('SELECT * FROM toolset ORDER BY category, name').all();
    return json({ tools: results });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    if (!body.name) return jsonError('name is required', 400);

    const sql = `INSERT INTO toolset (name, category, workspace, installed_version, latest_version, release_date, breaking_changes, target_upgrade, website_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.prepare(sql).bind(
      body.name,
      body.category || 'library',
      body.workspace || 'shared',
      body.installed_version || '',
      body.latest_version || '',
      body.release_date || '',
      body.breaking_changes || '',
      body.target_upgrade || '',
      body.website_url || '',
      body.notes || ''
    ).run();

    return json({ success: true });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    if (!body.id) return jsonError('id is required', 400);

    const fields = ['name', 'category', 'workspace', 'installed_version', 'latest_version', 'release_date', 'breaking_changes', 'target_upgrade', 'website_url', 'notes'];
    const updates: string[] = [];
    const params: any[] = [];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(body[field]);
      }
    }

    if (!updates.length) return jsonError('No fields to update', 400);

    updates.push("updated_at = datetime('now')");
    updates.push("last_checked = datetime('now')");
    params.push(body.id);

    const sql = `UPDATE toolset SET ${updates.join(', ')} WHERE id = ?`;
    await db.prepare(sql).bind(...params).run();

    return json({ success: true });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  const id = url.searchParams.get('id');
  if (!id) return jsonError('id query param required', 400);

  try {
    await db.prepare('DELETE FROM toolset WHERE id = ?').bind(Number(id)).run();
    return json({ success: true });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
}
