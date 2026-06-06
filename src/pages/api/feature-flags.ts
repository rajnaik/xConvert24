import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/feature-flags — get all feature flags with their status for the current environment
 * POST /api/feature-flags — update a flag (admin)
 *   Body: { id: string, enabled_dev?: boolean, enabled_staging?: boolean, enabled_live?: boolean }
 */

function getEnvironment(url: URL): 'dev' | 'staging' | 'live' {
  const host = url.hostname;
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'dev';
  if (host.includes('staging')) return 'staging';
  return 'live';
}

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ flags: [], environment: 'unknown' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const environment = getEnvironment(url);
  const rows = await db.prepare('SELECT * FROM feature_flags ORDER BY name ASC').all();
  const flags = (rows?.results || []).map((f: any) => ({
    ...f,
    enabled: environment === 'dev' ? !!f.enabled_dev : environment === 'staging' ? !!f.enabled_staging : !!f.enabled_live,
  }));

  return new Response(JSON.stringify({ flags, environment }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
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

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Flag id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare('DELETE FROM feature_flags WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
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

  const { id, name, description, enabled_dev, enabled_staging, enabled_live, _action } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Flag id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create a new flag
  if (_action === 'create') {
    if (!name) {
      return new Response(JSON.stringify({ error: 'Flag name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await db.prepare(
      `INSERT INTO feature_flags (id, name, description, enabled_dev, enabled_staging, enabled_live) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, name, description || '', enabled_dev ? 1 : 0, enabled_staging ? 1 : 0, enabled_live ? 1 : 0).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Update existing flag
  const updates: string[] = [];
  const binds: any[] = [];

  if (name !== undefined) { updates.push('name = ?'); binds.push(name); }
  if (description !== undefined) { updates.push('description = ?'); binds.push(description); }
  if (enabled_dev !== undefined) { updates.push('enabled_dev = ?'); binds.push(enabled_dev ? 1 : 0); }
  if (enabled_staging !== undefined) { updates.push('enabled_staging = ?'); binds.push(enabled_staging ? 1 : 0); }
  if (enabled_live !== undefined) { updates.push('enabled_live = ?'); binds.push(enabled_live ? 1 : 0); }
  updates.push('updated_at = datetime("now")');
  binds.push(id);

  await db.prepare(
    `UPDATE feature_flags SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...binds).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
