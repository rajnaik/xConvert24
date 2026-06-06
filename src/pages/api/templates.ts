import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/templates — list all templates (latest modified first)
 * POST /api/templates — create or update a template
 *   Body: { id?: number, name: string, body: string }
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT * FROM templates ORDER BY modified_at DESC LIMIT 50'
  ).all();

  return new Response(JSON.stringify({ templates: results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, name, body: templateBody } = body;

  if (!name || !templateBody) {
    return new Response(JSON.stringify({ error: 'name and body are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (id) {
    // Update existing template — increment version, save old version
    const existing = await db.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const newVersion = (existing.version || 1) + 1;

    // Save current version to history (keep max 5)
    await db.prepare(
      'INSERT INTO template_versions (template_id, version, name, body) VALUES (?, ?, ?, ?)'
    ).bind(id, existing.version, existing.name, existing.body).run();

    // Delete old versions beyond 5
    await db.prepare(
      'DELETE FROM template_versions WHERE template_id = ? AND id NOT IN (SELECT id FROM template_versions WHERE template_id = ? ORDER BY version DESC LIMIT 5)'
    ).bind(id, id).run();

    // Update template
    await db.prepare(
      "UPDATE templates SET name = ?, body = ?, version = ?, modified_at = datetime('now') WHERE id = ?"
    ).bind(name, templateBody, newVersion, id).run();

    return new Response(JSON.stringify({ success: true, id, version: newVersion }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } else {
    // Create new template
    const result = await db.prepare(
      'INSERT INTO templates (name, body, version) VALUES (?, ?, 1)'
    ).bind(name, templateBody).run();

    return new Response(JSON.stringify({ success: true, id: result.meta?.last_row_id }), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  }
};
