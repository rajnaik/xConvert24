import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/wotd-admin — list all WOTD entries with pagination, search, and filters
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  const url = new URL(request.url);

  // Single record fetch by ID
  const idParam = url.searchParams.get('id');
  if (idParam) {
    const word = await db.prepare('SELECT * FROM word_of_the_day WHERE id = ?').bind(parseInt(idParam)).first();
    return json({ word: word || null, words: word ? [word] : [] });
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const search = url.searchParams.get('search') || '';
  const filter = url.searchParams.get('filter') || ''; // 'assigned', 'unassigned', 'no-meaning'

  let where = '1=1';
  const binds: any[] = [];

  if (search) {
    where += ' AND (word LIKE ? OR meaning LIKE ?)';
    binds.push(`%${search}%`, `%${search}%`);
  }

  if (filter === 'assigned') {
    where += ' AND date IS NOT NULL';
  } else if (filter === 'unassigned') {
    where += ' AND date IS NULL';
  } else if (filter === 'no-meaning') {
    where += " AND (meaning = '' OR meaning IS NULL)";
  }

  // Get total count
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM word_of_the_day WHERE ${where}`);
  const countResult = await (binds.length ? countStmt.bind(...binds) : countStmt).first();
  const total = countResult?.total || 0;

  // Sorting
  const allowedSortCols: Record<string, string> = {
    word: 'word', date: 'date', meaning: 'meaning', fun_fact: 'fun_fact', id: 'id',
  };
  const sortParam = url.searchParams.get('sort') || 'date';
  const orderParam = (url.searchParams.get('order') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const sortCol = allowedSortCols[sortParam] || 'date';
  const orderClause = `${sortCol} ${orderParam}${sortCol !== 'id' ? ', id DESC' : ''}`;

  // Get rows
  const dataStmt = db.prepare(
    `SELECT * FROM word_of_the_day WHERE ${where} ORDER BY ${orderClause} LIMIT ? OFFSET ?`
  );
  const allBinds = [...binds, limit, offset];
  const result = await dataStmt.bind(...allBinds).all();

  // Get summary stats
  const stats = await db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN date IS NOT NULL THEN 1 ELSE 0 END) as assigned,
      SUM(CASE WHEN date IS NULL THEN 1 ELSE 0 END) as unassigned,
      SUM(CASE WHEN meaning = '' OR meaning IS NULL THEN 1 ELSE 0 END) as no_meaning,
      MIN(date) as earliest_date,
      MAX(date) as latest_date
    FROM word_of_the_day
  `).first();

  return json({
    words: result.results,
    total,
    limit,
    offset,
    stats,
  });
};

// POST /api/wotd-admin — create a new WOTD entry
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  const body = await request.json() as any;
  const { word, date, meaning, fun_fact, origin, usage_example, spelling_tip, cultural_note } = body;

  if (!word) return json({ error: 'word is required' }, 400);
  if (!meaning) return json({ error: 'meaning is required (words-must-have-meanings rule)' }, 400);

  try {
    await db.prepare(`
      INSERT INTO word_of_the_day (word, date, meaning, fun_fact, origin, usage_example, spelling_tip, cultural_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      word.toUpperCase().trim(),
      date || null,
      meaning.trim(),
      fun_fact || '',
      origin || '',
      usage_example || '',
      spelling_tip || '',
      cultural_note || ''
    ).run();

    return json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return json({ error: `Word "${word}" already exists` }, 409);
    }
    return json({ error: e.message || 'Insert failed' }, 500);
  }
};

// PUT /api/wotd-admin — update an existing WOTD entry
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  const body = await request.json() as any;
  const { id, word, date, meaning, fun_fact, origin, usage_example, spelling_tip, cultural_note } = body;

  if (!id) return json({ error: 'id is required' }, 400);
  if (!meaning) return json({ error: 'meaning is required (words-must-have-meanings rule)' }, 400);

  try {
    await db.prepare(`
      UPDATE word_of_the_day
      SET word = ?, date = ?, meaning = ?, fun_fact = ?, origin = ?, usage_example = ?, spelling_tip = ?, cultural_note = ?
      WHERE id = ?
    `).bind(
      word ? word.toUpperCase().trim() : '',
      date || null,
      meaning.trim(),
      fun_fact || '',
      origin || '',
      usage_example || '',
      spelling_tip || '',
      cultural_note || '',
      id
    ).run();

    return json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return json({ error: `Word "${word}" already exists` }, 409);
    }
    return json({ error: e.message || 'Update failed' }, 500);
  }
};

// DELETE /api/wotd-admin — delete a WOTD entry by id
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  const body = await request.json() as any;
  const { id } = body;

  if (!id) return json({ error: 'id is required' }, 400);

  await db.prepare('DELETE FROM word_of_the_day WHERE id = ?').bind(id).run();
  return json({ success: true });
};
