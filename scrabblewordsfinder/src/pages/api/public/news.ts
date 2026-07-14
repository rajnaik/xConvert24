import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/news/ — Latest Scrabble News (public, read-only)
 *
 * Query params:
 *   ?category=tournament | player | rules | community | general
 *   ?limit=10 (default, max 30)
 *
 * Returns only approved + active news from the last 30 days.
 * Cached for 15 minutes.
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('Service unavailable', 503);

  try {
    const category = url.searchParams.get('category');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 30);

    let query: string;
    let params: any[] = [];

    if (category) {
      query = "SELECT title, summary, source_url, source_name, category, published_date, fetched_at FROM latest_news WHERE active = 1 AND approved = 1 AND category = ? AND fetched_at > datetime('now', '-30 days') ORDER BY fetched_at DESC LIMIT ?";
      params = [category, limit];
    } else {
      query = "SELECT title, summary, source_url, source_name, category, published_date, fetched_at FROM latest_news WHERE active = 1 AND approved = 1 AND fetched_at > datetime('now', '-30 days') ORDER BY fetched_at DESC LIMIT ?";
      params = [limit];
    }

    const { results } = await db.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      news: results,
      total: results.length,
      source: 'ScrabbleWordsFinder.com',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900',
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
