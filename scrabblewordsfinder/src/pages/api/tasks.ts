import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/tasks — CRUD for the tasks table
 *
 * GET    /api/tasks          → list all tasks (optional ?status=&category=&limit=)
 * GET    /api/tasks?id=N     → get single task
 * POST   /api/tasks          → create task
 * PUT    /api/tasks          → update task (requires id in body)
 * DELETE /api/tasks          → delete task (requires id in body or ?id=N)
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  const id = url.searchParams.get('id');

  try {
    if (id) {
      const row = await db.prepare('SELECT * FROM tasks WHERE id = ?').bind(Number(id)).first();
      if (!row) return jsonError('Task not found', 404);
      return json(row);
    }

    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100') || 100, 500);

    let query = 'SELECT * FROM tasks';
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (category) { conditions.push('task_category = ?'); params.push(category); }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY date_created DESC LIMIT ?';
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all();
    return json({ tasks: results, total: results.length });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  let body: any;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }

  const { task_name, task_category, task_description, status, plan, estimate, approval, results, suggested_improvements, running_updates } = body;
  if (!task_name) return jsonError('task_name is required', 400);
  if (!task_description || task_description.trim().length < 10) {
    return jsonError('task_description is required (min 10 chars)', 400);
  }

  try {
    const initialStatus = (status || 'pending').trim();
    const runningStartedAt = initialStatus === 'running' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;

    const result = await db.prepare(
      `INSERT INTO tasks (task_name, task_category, task_description, status, plan, estimate, approval, results, suggested_improvements, running_started_at, running_updates)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      task_name.trim(),
      (task_category || 'general').trim(),
      task_description.trim(),
      initialStatus,
      (plan || '').trim(),
      (estimate || '').trim(),
      (approval || 'pending').trim(),
      (results || '').trim(),
      (suggested_improvements || '').trim(),
      runningStartedAt,
      (running_updates || '').trim()
    ).run();

    return json({ ok: true, id: result.meta?.last_row_id });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  let body: any;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON', 400); }

  const { id, task_name, task_category, task_description, status, plan, estimate, approval, results, suggested_improvements, running_updates } = body;
  if (!id) return jsonError('id is required', 400);

  const fields: string[] = [];
  const params: any[] = [];

  if (task_name !== undefined) { fields.push('task_name = ?'); params.push(task_name.trim()); }
  if (task_category !== undefined) { fields.push('task_category = ?'); params.push(task_category.trim()); }
  if (task_description !== undefined) { fields.push('task_description = ?'); params.push(task_description.trim()); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status.trim()); }
  if (plan !== undefined) { fields.push('plan = ?'); params.push(plan.trim()); }
  if (estimate !== undefined) { fields.push('estimate = ?'); params.push(estimate.trim()); }
  if (approval !== undefined) { fields.push('approval = ?'); params.push(approval.trim()); }
  if (results !== undefined) { fields.push('results = ?'); params.push(results.trim()); }
  if (suggested_improvements !== undefined) { fields.push('suggested_improvements = ?'); params.push(suggested_improvements.trim()); }
  if (running_updates !== undefined) { fields.push('running_updates = ?'); params.push(running_updates.trim()); }

  if (!fields.length) return jsonError('No fields to update', 400);

  // ─── Running Time Trigger Logic ────────────────────────────────
  // When status transitions TO "running": stamp running_started_at
  // When status transitions AWAY from "running": accumulate elapsed time into running_time
  if (status !== undefined) {
    const newStatus = status.trim();
    try {
      const existing = await db.prepare('SELECT status, running_started_at, running_time FROM tasks WHERE id = ?').bind(Number(id)).first() as any;
      if (existing) {
        const oldStatus = existing.status;
        if (newStatus === 'running' && oldStatus !== 'running') {
          // Entering running state — record the start timestamp, clear running updates
          fields.push("running_started_at = datetime('now')");
          // Only clear running_updates if not explicitly provided in this request
          if (running_updates === undefined) {
            fields.push("running_updates = ''");
          }
        } else if (newStatus !== 'running' && oldStatus === 'running' && existing.running_started_at) {
          // Leaving running state — accumulate elapsed seconds
          const startedAt = new Date(existing.running_started_at + 'Z').getTime();
          const now = Date.now();
          const elapsedSeconds = Math.max(0, Math.round((now - startedAt) / 1000));
          const accumulated = (existing.running_time || 0) + elapsedSeconds;
          fields.push('running_time = ?');
          params.push(accumulated);
          fields.push('running_started_at = NULL');
        }
      }
    } catch { /* non-critical — proceed with update */ }
  }

  fields.push("date_modified = datetime('now')");
  params.push(Number(id));

  try {
    await db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...params).run();
    return json({ ok: true });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  let id = url.searchParams.get('id');
  if (!id) {
    try {
      const body = await request.json();
      id = body.id;
    } catch {}
  }
  if (!id) return jsonError('id is required', 400);

  try {
    await db.prepare('DELETE FROM tasks WHERE id = ?').bind(Number(id)).run();
    return json({ ok: true });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
}
