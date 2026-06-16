import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// POST /api/wordbench-practice — log a practiced word
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, word, meaning } = body;

  if (!word) return new Response(JSON.stringify({ error: 'word required' }), { status: 400 });

  await db.prepare(
    'INSERT INTO wordbench_practice (user_id, word, meaning) VALUES (?, ?, ?)'
  ).bind(user_id || '', word, meaning || '').run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// GET /api/wordbench-practice — get practice history for a user
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

  let result;
  if (userId === '__all__') {
    result = await db.prepare('SELECT * FROM wordbench_practice ORDER BY created_at DESC LIMIT 500').all();
  } else {
    result = await db.prepare(
      'SELECT * FROM wordbench_practice WHERE user_id = ? ORDER BY created_at DESC LIMIT 200'
    ).bind(userId).all();
  }

  return new Response(JSON.stringify({ records: result.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
