import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/challenge/ — Today's Daily Challenges (public, read-only)
 *
 * Returns today's Daily Rack + Daily Anagram.
 * Cached for 1 hour.
 */

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  try {
    const today = new Date().toISOString().split('T')[0];

    const [rack, anagram] = await Promise.all([
      db.prepare('SELECT date, rack, best_word, best_score, meaning FROM daily_rack WHERE date = ?').bind(today).first(),
      db.prepare('SELECT date, scrambled, hint, word_length, meaning FROM daily_anagram WHERE date = ?').bind(today).first(),
    ]);

    return new Response(JSON.stringify({
      date: today,
      daily_rack: rack ? {
        rack: rack.rack,
        best_word: rack.best_word,
        best_score: rack.best_score,
        meaning: rack.meaning || '',
      } : null,
      daily_anagram: anagram ? {
        scrambled: anagram.scrambled,
        hint: anagram.hint,
        word_length: anagram.word_length,
        meaning: anagram.meaning || '',
      } : null,
      source: 'ScrabbleWordsFinder.com',
      note: 'Answers are included — intended for integration, not spoiling players.',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
