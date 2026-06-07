import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/contagions
 * Returns all active contagions ordered by ConID (database insertion order).
 * Used by the Contagion Tracker page to determine display order of disease tabs.
 */
export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;

  if (!db) {
    return new Response(JSON.stringify({ contagions: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await db.prepare(
      'SELECT ConID, ConName, ConVariant, Status FROM Contagion WHERE Status = 1 ORDER BY ConID ASC'
    ).all();

    const contagions = (result.results || []).map((row: any) => ({
      id: row.ConID,
      name: row.ConName,
      variant: row.ConVariant,
    }));

    return new Response(JSON.stringify({ contagions }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({ contagions: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
