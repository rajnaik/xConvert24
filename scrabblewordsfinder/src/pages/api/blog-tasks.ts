import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');
  const readyStatus = url.searchParams.get('ready_status');
  const limit = url.searchParams.get('limit') || '50';
  const offset = url.searchParams.get('offset') || '0';

  let query = 'SELECT * FROM blog_ideas WHERE 1=1';
  const binds: any[] = [];

  if (category) { query += ' AND category = ?'; binds.push(category); }
  if (status) { query += ' AND status = ?'; binds.push(status); }
  if (readyStatus) { query += ' AND ready_status = ?'; binds.push(readyStatus); }

  query += ' ORDER BY priority DESC, id ASC LIMIT ? OFFSET ?';
  binds.push(Number(limit), Number(offset));

  const { results } = await db.prepare(query).bind(...binds).all();

  // Get counts
  const { results: countResults } = await db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN status = \'pending\' THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END) as completed FROM blog_ideas').all();
  const counts = countResults[0] || { total: 0, pending: 0, completed: 0 };

  // Get distinct categories
  const { results: cats } = await db.prepare('SELECT DISTINCT category FROM blog_ideas ORDER BY category').all();

  return new Response(JSON.stringify({ tasks: results, counts, categories: cats.map((c: any) => c.category) }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { category, title, status, estimated_execution_time, agent_name, ready_status } = body;

  if (!title) return new Response(JSON.stringify({ error: 'title required' }), { status: 400 });

  const result = await db.prepare(
    'INSERT INTO blog_ideas (category, title, status, estimated_execution_time, agent_name, ready_status) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(category || '', title, status || 'pending', estimated_execution_time || '', agent_name || '', ready_status || 'pending').run();

  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();
  const { id, category, title, status, estimated_execution_time, agent_name, ready_status } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare(
    'UPDATE blog_ideas SET category = ?, title = ?, status = ?, estimated_execution_time = ?, agent_name = ?, ready_status = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(category || '', title || '', status || 'pending', estimated_execution_time || '', agent_name || '', ready_status || 'pending', id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM blog_ideas WHERE id = ?').bind(Number(id)).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
