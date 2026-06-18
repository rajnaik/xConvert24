import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/wotd — get today's word of the day
// GET /api/wotd?all=true — list all words (admin)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const all = url.searchParams.get('all');

  if (all) {
    const result = await db.prepare('SELECT * FROM word_of_the_day ORDER BY date DESC, id ASC LIMIT 100').all();
    return new Response(JSON.stringify({ words: result.results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get today's word — find one assigned to today, or pick the next unassigned
  const today = new Date().toISOString().split('T')[0];

  let todayWord = await db.prepare('SELECT * FROM word_of_the_day WHERE date = ?').bind(today).first();

  if (!todayWord) {
    // Assign next unassigned word to today
    const unassigned = await db.prepare('SELECT * FROM word_of_the_day WHERE date IS NULL ORDER BY id ASC LIMIT 1').first();
    if (unassigned) {
      await db.prepare('UPDATE word_of_the_day SET date = ? WHERE id = ?').bind(today, unassigned.id).run();
      todayWord = { ...unassigned, date: today };
    }
  }

  if (!todayWord) {
    return new Response(JSON.stringify({ error: 'No words available' }), { status: 404 });
  }

  // Calculate next midnight UTC for client-side cache expiry
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const expiresAt = tomorrow.toISOString();

  return new Response(JSON.stringify({ word: todayWord, expiresAt }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};

// POST /api/wotd — add a word (admin) or update meaning
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { word, meaning, fun_fact } = body;

  if (!word) return new Response(JSON.stringify({ error: 'word required' }), { status: 400 });

  await db.prepare(`
    INSERT INTO word_of_the_day (word, meaning, fun_fact) VALUES (?, ?, ?)
    ON CONFLICT(word) DO UPDATE SET meaning = excluded.meaning, fun_fact = excluded.fun_fact
  `).bind(word, meaning || '', fun_fact || '').run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
