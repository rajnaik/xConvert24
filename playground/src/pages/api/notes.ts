import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/notes — list all notes (or ?id=X for single)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    const note = await db.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
    if (!note) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify({ note }), { headers: { 'Content-Type': 'application/json' } });
  }

  const result = await db.prepare('SELECT id, title, filename, folder_id, created_at, updated_at FROM notes ORDER BY updated_at DESC').all();
  return new Response(JSON.stringify({ notes: result.results }), { headers: { 'Content-Type': 'application/json' } });
};

// POST /api/notes — create a new note
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { title, content, folder_id } = body;

  if (!content && !title) return new Response(JSON.stringify({ error: 'content or title required' }), { status: 400 });

  // Generate filename: DDMMMYYYY_Kiro
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dd = String(now.getDate()).padStart(2, '0');
  const mmm = months[now.getMonth()];
  const yyyy = now.getFullYear();
  const filename = `${dd}${mmm}${yyyy}_Kiro`;

  const noteTitle = title || filename;

  const result = await db.prepare(
    'INSERT INTO notes (title, filename, content, folder_id) VALUES (?, ?, ?, ?)'
  ).bind(noteTitle, filename, content || '', folder_id || null).run();

  return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id, filename }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT /api/notes — update a note
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { id, title, content, folder_id } = body;

  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  if (folder_id !== undefined) {
    await db.prepare('UPDATE notes SET folder_id = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(folder_id, id).run();
  }
  if (title !== undefined || content !== undefined) {
    await db.prepare(
      'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(title || null, content || null, id).run();
  }

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

// DELETE /api/notes — delete a note
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
