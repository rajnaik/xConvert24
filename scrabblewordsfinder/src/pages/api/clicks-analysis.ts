import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/clicks-analysis — returns all rows from ClicksAnalysis with geo data
 */
export const GET: APIRoute = async () => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await db.prepare(
      'SELECT ip_address, click_count, latitude, longitude, city, country, last_seen FROM ClicksAnalysis ORDER BY click_count DESC'
    ).all();

    return new Response(JSON.stringify({ points: results || [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error', stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
