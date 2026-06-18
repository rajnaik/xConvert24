import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// POST /api/quiz-scores — save a quiz score
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, score, total, time_used, timer_limit, timed_out, details } = body;

  if (score === undefined || total === undefined) {
    return new Response(JSON.stringify({ error: 'score and total required' }), { status: 400 });
  }

  const detailsStr = details ? JSON.stringify(details) : '';

  await db.prepare(
    'INSERT INTO quiz_scores (user_id, score, total, time_used, timer_limit, timed_out, details) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(user_id || '', score, total, time_used || 0, timer_limit || 90, timed_out || 0, detailsStr).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// GET /api/quiz-scores — get quiz scores (optionally filter by user_id)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  let result;
  if (userId) {
    result = await db.prepare('SELECT * FROM quiz_scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(userId).all();
  } else {
    result = await db.prepare('SELECT * FROM quiz_scores ORDER BY created_at DESC LIMIT 100').all();
  }

  return new Response(JSON.stringify({ scores: result.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
