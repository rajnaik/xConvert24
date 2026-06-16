import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/media — list files or serve a single file by ?id=X
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (id) {
    // Serve the file
    const file = await db.prepare('SELECT filename, content_type, data FROM media WHERE id = ?').bind(id).first();
    if (!file) return new Response('Not found', { status: 404 });

    const binary = Uint8Array.from(atob(file.data as string), c => c.charCodeAt(0));
    return new Response(binary, {
      headers: {
        'Content-Type': (file.content_type as string) || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.filename}"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // List all files (without data blob)
  const result = await db.prepare('SELECT id, filename, content_type, size, folder_id, uploaded_at FROM media ORDER BY uploaded_at DESC').all();
  return new Response(JSON.stringify({ files: result.results }), { headers: { 'Content-Type': 'application/json' } });
};

// POST /api/media — upload a file (stores as base64 in D1)
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });

  const folderId = formData.get('folder_id') as string | null;

  // Max 750KB per file (D1 row limit is 1MB, base64 adds 33% overhead)
  if (file.size > 750 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large (max 750KB for D1 storage).' }), { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  // Chunked base64 encoding (avoids stack overflow on large files)
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  const base64 = btoa(binary);

  await db.prepare(
    'INSERT INTO media (filename, content_type, size, data, folder_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(file.name, file.type, file.size, base64, folderId ? parseInt(folderId) : null).run();

  return new Response(JSON.stringify({ success: true, filename: file.name, size: file.size }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT /api/media — move a file to a folder { id, folder_id }
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { id, folder_id } = body;
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('UPDATE media SET folder_id = ? WHERE id = ?').bind(folder_id || null, id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};

// DELETE /api/media — delete a file
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
