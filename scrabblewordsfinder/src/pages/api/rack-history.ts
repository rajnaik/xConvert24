import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/rack-history?user_id=xxx — fetch user's rack history (grouped by date)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
  }

  // Get count for conditional history icon display
  const countOnly = url.searchParams.get('count');
  if (countOnly === 'true') {
    const row = await db.prepare(
      'SELECT COUNT(*) as total FROM rack_history WHERE user_id = ?'
    ).bind(userId).first();
    return new Response(JSON.stringify({ count: row?.total || 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch all history entries ordered by date desc, limited to last 200
  const result = await db.prepare(
    'SELECT word, score, meaning, submitted_at FROM rack_history WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 200'
  ).bind(userId).all();

  // Fetch the rack tiles for each unique date in the history
  const dates = [...new Set((result.results as any[]).map((r: any) => {
    if (!r.submitted_at) return null;
    // Handle both ISO format (T separator) and SQLite format (space separator)
    return r.submitted_at.split(/[T ]/)[0];
  }).filter(Boolean))];
  let racks: Record<string, string> = {};
  if (dates.length > 0) {
    const placeholders = dates.map(() => '?').join(',');
    const rackRows = await db.prepare(
      `SELECT date, rack FROM daily_rack WHERE date IN (${placeholders})`
    ).bind(...dates).all();
    for (const row of rackRows.results as any[]) {
      racks[row.date] = row.rack;
    }
  }

  return new Response(JSON.stringify({ history: result.results, racks }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/rack-history — save a submitted word
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, word, score, meaning } = body;

  if (!user_id || !word) {
    return new Response(JSON.stringify({ error: 'user_id and word required' }), { status: 400 });
  }

  await db.prepare(
    'INSERT INTO rack_history (user_id, word, score, meaning) VALUES (?, ?, ?, ?)'
  ).bind(user_id, word.toUpperCase(), score || 0, meaning || '').run();

  // Return updated count so client can show/hide history icon
  const row = await db.prepare(
    'SELECT COUNT(*) as total FROM rack_history WHERE user_id = ?'
  ).bind(user_id).first();

  return new Response(JSON.stringify({ success: true, count: row?.total || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
