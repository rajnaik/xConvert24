import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/opinions?question_id=xxx — get opinions for a question (admin: last 10)
 * POST /api/opinions — submit an opinion
 *   Body: { user_id: string, question_id: string, response: string }
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ opinions: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const questionId = url.searchParams.get('question_id');
  let rows;

  if (questionId) {
    rows = await db.prepare(
      'SELECT * FROM opinions WHERE question_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(questionId).all();
  } else {
    rows = await db.prepare(
      'SELECT * FROM opinions ORDER BY created_at DESC LIMIT 10'
    ).all();
  }

  return new Response(JSON.stringify({ opinions: rows?.results || [] }), {
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

  const { user_id, question_id, response } = body;
  if (!user_id || !question_id || !response) {
    return new Response(JSON.stringify({ error: 'user_id, question_id, and response required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if user already answered this question
  const existing = await db.prepare(
    'SELECT id FROM opinions WHERE user_id = ? AND question_id = ?'
  ).bind(user_id, question_id).first();

  if (existing) {
    // Update existing response
    await db.prepare(
      'UPDATE opinions SET response = ?, created_at = datetime("now") WHERE user_id = ? AND question_id = ?'
    ).bind(response, user_id, question_id).run();
  } else {
    // Insert new opinion
    await db.prepare(
      'INSERT INTO opinions (user_id, question_id, response) VALUES (?, ?, ?)'
    ).bind(user_id, question_id, response).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
