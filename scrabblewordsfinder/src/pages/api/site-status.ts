import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/site-status — Read and update site status (single-row table)
 *
 * GET  /api/site-status  → returns { status, logo_option, banner_option, banner_id, updated_at, updated_by }
 * PUT  /api/site-status  → update any fields (status, logo_option, banner_option, banner_id, updated_by)
 */

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const row = await db.prepare('SELECT * FROM site_status WHERE id = 1').first();
    if (!row) return jsonError('Site status not found', 404);
    return json(row);
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  try {
    const body = await request.json();
    const updates: string[] = [];
    const params: any[] = [];

    if (body.status !== undefined) {
      const valid = ['golden', 'green', 'red'];
      if (!valid.includes(body.status)) return jsonError(`Invalid status. Must be one of: ${valid.join(', ')}`, 400);
      updates.push('status = ?');
      params.push(body.status);
    }

    if (body.logo_option !== undefined) {
      const opt = Number(body.logo_option);
      if (!opt || opt < 1 || opt > 5) return jsonError('logo_option must be between 1 and 5', 400);
      updates.push('logo_option = ?');
      params.push(opt);
    }

    if (body.banner_option !== undefined) {
      const opt = Number(body.banner_option);
      if (!opt || opt < 1 || opt > 10) return jsonError('banner_option must be between 1 and 10', 400);
      updates.push('banner_option = ?');
      params.push(opt);
    }

    if (body.banner_id !== undefined) {
      if (body.banner_id === null || body.banner_id === '') {
        updates.push('banner_id = NULL');
      } else {
        updates.push('banner_id = ?');
        params.push(String(body.banner_id));
      }
    }

    if (body.updated_by !== undefined) {
      updates.push('updated_by = ?');
      params.push(String(body.updated_by));
    }

    if (!updates.length) return jsonError('No valid fields to update', 400);

    updates.push("updated_at = datetime('now')");

    const sql = `UPDATE site_status SET ${updates.join(', ')} WHERE id = 1`;
    await db.prepare(sql).bind(...params).run();

    // Return updated row
    const row = await db.prepare('SELECT * FROM site_status WHERE id = 1').first();
    return json(row);
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
