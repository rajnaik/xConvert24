import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/word-quiz — get N random quiz words with meanings (default 10, min 3, max 10)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  let count = parseInt(url.searchParams.get('count') || '10');
  if (isNaN(count) || count < 3) count = 3;
  if (count > 10) count = 10;

  // Get N random words for the quiz
  const result = await db.prepare('SELECT id, word, meaning FROM word_quiz ORDER BY RANDOM() LIMIT ?').bind(count).all();

  // Get 3x fake meanings for options
  const fakeCount = count * 3;
  const fakes = await db.prepare('SELECT meaning FROM word_quiz ORDER BY RANDOM() LIMIT ?').bind(fakeCount).all();

  return new Response(JSON.stringify({
    questions: result.results,
    fakeMeanings: fakes.results.map((r: any) => r.meaning),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
