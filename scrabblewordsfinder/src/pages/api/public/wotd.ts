import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/wotd/ — Today's Word of the Day (public, read-only)
 *
 * Returns: { word, meaning, fun_fact, date }
 * Cached for 1 hour.
 */

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  try {
    const today = new Date().toISOString().split('T')[0];
    const row = await db.prepare(
      'SELECT word, meaning, fun_fact, origin, usage_example, date FROM word_of_the_day WHERE date = ?'
    ).bind(today).first();

    if (!row) {
      return json({ word: null, date: today, message: 'No word available for today' });
    }

    return new Response(JSON.stringify({
      word: row.word,
      meaning: row.meaning,
      fun_fact: row.fun_fact || '',
      origin: row.origin || '',
      usage_example: row.usage_example || '',
      date: row.date,
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

function json(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
