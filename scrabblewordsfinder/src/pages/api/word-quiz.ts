import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/word-quiz — get 10 random quiz words with meanings
export const GET: APIRoute = async () => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  // Get 10 random words for the quiz
  const result = await db.prepare('SELECT id, word, meaning FROM word_quiz ORDER BY RANDOM() LIMIT 10').all();

  // Get 30 extra meanings for fake options (3 per question)
  const fakes = await db.prepare('SELECT meaning FROM word_quiz ORDER BY RANDOM() LIMIT 30').all();

  return new Response(JSON.stringify({
    questions: result.results,
    fakeMeanings: fakes.results.map((r: any) => r.meaning),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
