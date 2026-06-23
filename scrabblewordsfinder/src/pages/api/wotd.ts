import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/wotd — get today's word of the day
// GET /api/wotd?date=YYYY-MM-DD — get word for a specific date
// GET /api/wotd?all=true — list all words (admin)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const all = url.searchParams.get('all');
  const dateParam = url.searchParams.get('date');

  if (all) {
    const result = await db.prepare('SELECT * FROM word_of_the_day ORDER BY date DESC, id ASC LIMIT 100').all();
    return new Response(JSON.stringify({ words: result.results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Determine target date
  const today = new Date().toISOString().split('T')[0];
  const targetDate = dateParam || today;

  let word = await db.prepare('SELECT * FROM word_of_the_day WHERE date = ?').bind(targetDate).first();

  if (!word && targetDate === today) {
    // Assign next unassigned word to today
    const unassigned = await db.prepare('SELECT * FROM word_of_the_day WHERE date IS NULL ORDER BY id ASC LIMIT 1').first();
    if (unassigned) {
      await db.prepare('UPDATE word_of_the_day SET date = ? WHERE id = ?').bind(today, unassigned.id).run();
      word = { ...unassigned, date: today };
    }
  }

  if (!word) {
    return new Response(JSON.stringify({ error: 'No word available for this date' }), { status: 404 });
  }

  // Calculate next midnight UTC for client-side cache expiry
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const expiresAt = tomorrow.toISOString();

  return new Response(JSON.stringify({ word, expiresAt, isToday: targetDate === today }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': targetDate === today ? 'public, max-age=3600, s-maxage=86400' : 'public, max-age=60',
    },
  });
};

// POST /api/wotd — add a word (admin) or update meaning + enriched fields
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { word, meaning, fun_fact, origin, usage_example, spelling_tip, cultural_note } = body;

  if (!word) return new Response(JSON.stringify({ error: 'word required' }), { status: 400 });

  await db.prepare(`
    INSERT INTO word_of_the_day (word, meaning, fun_fact, origin, usage_example, spelling_tip, cultural_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(word) DO UPDATE SET
      meaning = excluded.meaning,
      fun_fact = excluded.fun_fact,
      origin = excluded.origin,
      usage_example = excluded.usage_example,
      spelling_tip = excluded.spelling_tip,
      cultural_note = excluded.cultural_note
  `).bind(
    word,
    meaning || '',
    fun_fact || '',
    origin || '',
    usage_example || '',
    spelling_tip || '',
    cultural_note || ''
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
