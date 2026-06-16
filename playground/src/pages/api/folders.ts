import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/folders — list folders (optionally ?parent_id=X)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const parentId = url.searchParams.get('parent_id');

  let folders;
  if (parentId) {
    folders = await db.prepare('SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC').bind(parseInt(parentId)).all();
  } else {
    folders = await db.prepare('SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC').all();
  }

  return new Response(JSON.stringify({ folders: folders.results }), { headers: { 'Content-Type': 'application/json' } });
};

// POST /api/folders — create a folder { name, parent_id? }
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { name, parent_id } = body;
  if (!name || !name.trim()) return new Response(JSON.stringify({ error: 'name required' }), { status: 400 });

  const result = await db.prepare(
    'INSERT INTO folders (name, parent_id) VALUES (?, ?)'
  ).bind(name.trim(), parent_id || null).run();

  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), { headers: { 'Content-Type': 'application/json' } });
};

// PUT /api/folders — rename a folder { id, name }
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { id, name } = body;
  if (!id || !name) return new Response(JSON.stringify({ error: 'id and name required' }), { status: 400 });

  await db.prepare('UPDATE folders SET name = ? WHERE id = ?').bind(name.trim(), id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

// DELETE /api/folders?id=X — delete a folder (moves files to root)
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  // Move files in this folder back to root
  await db.prepare('UPDATE media SET folder_id = NULL WHERE folder_id = ?').bind(parseInt(id)).run();
  // Move notes in this folder back to root
  await db.prepare('UPDATE notes SET folder_id = NULL WHERE folder_id = ?').bind(parseInt(id)).run();
  // Move subfolders to root
  await db.prepare('UPDATE folders SET parent_id = NULL WHERE parent_id = ?').bind(parseInt(id)).run();
  // Delete the folder
  await db.prepare('DELETE FROM folders WHERE id = ?').bind(parseInt(id)).run();

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
