import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/hooks — list all hooks
 * POST /api/hooks — create a new hook
 * PATCH /api/hooks — update an existing hook
 * DELETE /api/hooks — delete a hook by id
 */

export const GET: APIRoute = async () => {
  try {
    const db = (env as any).BUGS_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await db.prepare(
      'SELECT * FROM hooks ORDER BY id ASC'
    ).all();

    return new Response(JSON.stringify({ hooks: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Unknown error', stack: e.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, description, version, enabled, event_type, event_patterns, event_tool_types, action_type, action_prompt, action_command } = body;

  if (!name || !event_type || !action_type) {
    return new Response(JSON.stringify({ error: 'name, event_type, and action_type are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await db.prepare(
    'INSERT INTO hooks (name, description, version, enabled, event_type, event_patterns, event_tool_types, action_type, action_prompt, action_command) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    name,
    description || '',
    version || '1.0.0',
    enabled !== undefined ? (enabled ? 1 : 0) : 1,
    event_type,
    event_patterns || '',
    event_tool_types || '',
    action_type,
    action_prompt || '',
    action_command || ''
  ).run();

  return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, name, description, version, enabled, event_type, event_patterns, event_tool_types, action_type, action_prompt, action_command } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'UPDATE hooks SET name = ?, description = ?, version = ?, enabled = ?, event_type = ?, event_patterns = ?, event_tool_types = ?, action_type = ?, action_prompt = ?, action_command = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(
    name || '',
    description || '',
    version || '1.0.0',
    enabled !== undefined ? (enabled ? 1 : 0) : 1,
    event_type || '',
    event_patterns || '',
    event_tool_types || '',
    action_type || '',
    action_prompt || '',
    action_command || '',
    id
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare('DELETE FROM hooks WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
