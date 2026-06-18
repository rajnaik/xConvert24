import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/sixty-seconds-history — Save all words from a completed round
 *   Body: { user_id, round_id, words: [{ word, points, attempt, split_time }] }
 *
 * GET /api/sixty-seconds-history?user_id=X — Retrieve round history for a user
 *   Returns rounds grouped with words, points, split_time, and total per round.
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: any;
    try {
      const text = await request.text();
      body = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { user_id, round_id, words } = body;
    if (!user_id || !round_id || !Array.isArray(words) || words.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing required fields: user_id, round_id, words[]' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert all words for this round in a batch
    const stmt = db.prepare(
      'INSERT INTO "60sec_history" (user_id, round_id, word, points, attempt, split_time) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const batch = words.map((w: any) =>
      stmt.bind(user_id, round_id, w.word || '', w.points || 0, w.attempt || 1, w.split_time ?? 60)
    );
    await db.batch(batch);

    // Calculate total for this round
    const total = words.reduce((sum: number, w: any) => sum + (w.points || 0), 0);

    return new Response(JSON.stringify({ ok: true, round_id, total, word_count: words.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all words for this user, ordered by created_at DESC
    const { results } = await db.prepare(
      'SELECT round_id, word, points, attempt, split_time, created_at FROM "60sec_history" WHERE user_id = ? ORDER BY created_at DESC LIMIT 500'
    ).bind(user_id).all();

    // Group by round_id
    const rounds: Record<string, any> = {};
    for (const row of results || []) {
      if (!rounds[row.round_id]) {
        rounds[row.round_id] = { round_id: row.round_id, created_at: row.created_at, words: [], total: 0 };
      }
      rounds[row.round_id].words.push({
        word: row.word,
        points: row.points,
        attempt: row.attempt,
        split_time: row.split_time,
      });
      rounds[row.round_id].total += row.points;
    }

    // Convert to array sorted by most recent first
    const roundList = Object.values(rounds);

    return new Response(JSON.stringify({ ok: true, rounds: roundList, count: roundList.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
