import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/achievements — list all achievements
export const GET: APIRoute = async () => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const result = await db.prepare('SELECT * FROM achievements ORDER BY date_created DESC LIMIT 50').all();

  return new Response(JSON.stringify({ achievements: result.results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/achievements — save a new achievement (quiz result)
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { achievement_text, a_data } = body;

  if (!achievement_text) return new Response(JSON.stringify({ error: 'achievement_text required' }), { status: 400 });

  const result = await db.prepare(
    'INSERT INTO achievements (achievement_text, a_data) VALUES (?, ?)'
  ).bind(achievement_text, a_data || '').run();

  return new Response(JSON.stringify({ success: true, a_id: result.meta?.last_row_id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
