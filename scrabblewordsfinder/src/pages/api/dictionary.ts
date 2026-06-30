import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/dictionary — Query the curated dictionary table
 *
 * GET /api/dictionary/?word=QUIXOTIC        → lookup a single word
 * GET /api/dictionary/?letter=Z             → words containing letter
 * GET /api/dictionary/?starts=QU            → words starting with
 * GET /api/dictionary/?ends=ZZ             → words ending with
 * GET /api/dictionary/?length=7             → words of exact length
 * GET /api/dictionary/?bingo=true           → 7+ letter words (bingo candidates)
 * GET /api/dictionary/?min_points=20        → words scoring at least N points
 * GET /api/dictionary/?top=10              → top N highest-scoring words
 * GET /api/dictionary/?q_no_u=true          → Q words without U
 * GET /api/dictionary/?random=5            → N random words
 *
 * Filters can be combined: ?letter=Z&length=3&top=5
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return jsonError('DB not configured', 500);

  const url = new URL(request.url);
  const word = url.searchParams.get('word');
  const letter = url.searchParams.get('letter');
  const starts = url.searchParams.get('starts');
  const ends = url.searchParams.get('ends');
  const length = url.searchParams.get('length');
  const bingo = url.searchParams.get('bingo');
  const minPoints = url.searchParams.get('min_points');
  const top = url.searchParams.get('top');
  const qNoU = url.searchParams.get('q_no_u');
  const random = url.searchParams.get('random');

  try {
    // Single word lookup
    if (word) {
      const row = await db.prepare(
        'SELECT word, meaning, points, fun_fact, origin, spelling_tip FROM dictionary WHERE word = ? COLLATE NOCASE'
      ).bind(word.toUpperCase()).first();

      if (!row) return json({ found: false, word: word.toUpperCase() });
      return json({ found: true, ...row });
    }

    // Build dynamic query
    const conditions: string[] = [];
    const bindings: any[] = [];

    if (letter) {
      conditions.push('word LIKE ?');
      bindings.push(`%${letter.toUpperCase()}%`);
    }

    if (starts) {
      conditions.push('word LIKE ?');
      bindings.push(`${starts.toUpperCase()}%`);
    }

    if (ends) {
      conditions.push('word LIKE ?');
      bindings.push(`%${ends.toUpperCase()}`);
    }

    if (length) {
      conditions.push('LENGTH(word) = ?');
      bindings.push(Number(length));
    }

    if (bingo === 'true') {
      conditions.push('LENGTH(word) >= 7');
    }

    if (minPoints) {
      conditions.push('points >= ?');
      bindings.push(Number(minPoints));
    }

    if (qNoU === 'true') {
      conditions.push("word LIKE '%Q%'");
      conditions.push("word NOT LIKE '%QU%'");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(Number(top || random || 20), 100);

    let orderBy = 'ORDER BY points DESC';
    if (random) {
      orderBy = 'ORDER BY RANDOM()';
    }

    const query = `SELECT word, meaning, points, fun_fact, origin, spelling_tip FROM dictionary ${where} ${orderBy} LIMIT ?`;
    bindings.push(limit);

    const { results } = await db.prepare(query).bind(...bindings).all();

    return json({
      count: results?.length || 0,
      words: results || [],
    });
  } catch (e: any) {
    return jsonError(e.message || 'Query failed', 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
