import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/achievements?user_id=X — list achievements (optionally filtered by user)
export const GET: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const userId = url.searchParams.get('user_id');

  let result;
  if (userId) {
    result = await db.prepare('SELECT * FROM achievements WHERE user_id = ? ORDER BY date_created DESC LIMIT 50').bind(userId).all();
  } else {
    result = await db.prepare('SELECT * FROM achievements ORDER BY date_created DESC LIMIT 50').all();
  }

  return new Response(JSON.stringify({ achievements: result.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/achievements — save a new tile score achievement
// Client sends: { user_id, achievement_id (level), encouragement_words, score, word }
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, achievement_id, encouragement_words, score, word } = body;

  if (!word) return new Response(JSON.stringify({ error: 'word is required' }), { status: 400 });

  const level = achievement_id || 0;
  const levelNames: Record<number, { name: string; icon: string }> = {
    1: { name: 'Rising Star', icon: '⭐' },
    2: { name: 'Word Builder', icon: '👍' },
    3: { name: 'Hot Streak', icon: '🔥' },
    4: { name: 'Triple Threat', icon: '🏆' },
    5: { name: 'Scrabble Legend', icon: '🌟' },
  };

  const info = levelNames[level] || { name: 'Achievement', icon: '🏅' };

  const result = await db.prepare(
    `INSERT INTO achievements (achievement_name, achievement_icon, achievement_words, achievement_text, a_data, user_id, word, score, level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    info.name,
    info.icon,
    word.toUpperCase(),
    encouragement_words || '',
    JSON.stringify({ score, level, word: word.toUpperCase() }),
    user_id || '',
    word.toUpperCase(),
    score || 0,
    level
  ).run();

  return new Response(JSON.stringify({ success: true, a_id: result.meta?.last_row_id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE /api/achievements?id=X — delete an achievement by ID
export const DELETE: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

  await db.prepare('DELETE FROM achievements WHERE achievement_id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
