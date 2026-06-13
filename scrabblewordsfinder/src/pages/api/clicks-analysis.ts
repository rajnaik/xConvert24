import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/clicks-analysis
 * Returns location data from the ClicksAnalysis table for the map view.
 * Only returns rows with valid lat/lng (non-null, non-zero, within geographic ranges).
 */
export const GET: APIRoute = async () => {
  const db = (env as any).DB;

  if (!db) {
    return json({ error: 'Service unavailable — database not configured' }, 503);
  }

  try {
    const { results } = await db.prepare(
      `SELECT ip_address, click_count, latitude, longitude, city, country, last_seen
       FROM ClicksAnalysis
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
         AND latitude != 0 AND longitude != 0
         AND latitude BETWEEN -90 AND 90
         AND longitude BETWEEN -180 AND 180`
    ).all();

    return json({ locations: results || [] });
  } catch (err: any) {
    return json({ error: err.message || 'Internal server error' }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
