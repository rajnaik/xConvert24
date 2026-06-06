import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/org-chart — get all agent statuses and recent tasks
 * POST /api/org-chart — update agent status or add a task
 *   Body: { agent_id: string, action: 'status' | 'task', status?: string, task?: string, duration?: string }
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ agents: [], tasks: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const agents = await db.prepare(
    'SELECT * FROM org_agents ORDER BY sort_order ASC'
  ).all();

  const tasks = await db.prepare(
    'SELECT * FROM org_tasks ORDER BY created_at DESC LIMIT 50'
  ).all();

  return new Response(JSON.stringify({
    agents: agents?.results || [],
    tasks: tasks?.results || [],
  }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { agent_id, action } = body;
  if (!agent_id || !action) {
    return new Response(JSON.stringify({ error: 'agent_id and action required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'status') {
    const { status } = body;
    if (!status) {
      return new Response(JSON.stringify({ error: 'status required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await db.prepare(
      'UPDATE org_agents SET status = ?, updated_at = datetime("now") WHERE agent_id = ?'
    ).bind(status, agent_id).run();
  } else if (action === 'task') {
    const { task, duration } = body;
    if (!task) {
      return new Response(JSON.stringify({ error: 'task required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await db.prepare(
      'INSERT INTO org_tasks (agent_id, task, duration) VALUES (?, ?, ?)'
    ).bind(agent_id, task, duration || null).run();
    // Update agent's last_active
    await db.prepare(
      'UPDATE org_agents SET updated_at = datetime("now"), status = "active" WHERE agent_id = ?'
    ).bind(agent_id).run();
    // Invalidate pipeline cache by bumping a version marker
    await db.prepare(
      'INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) SELECT 1, status, datetime("now"), "task-complete" FROM site_status WHERE id = 1'
    ).run().catch(() => {});
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
