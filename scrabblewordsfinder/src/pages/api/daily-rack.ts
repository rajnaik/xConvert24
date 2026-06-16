import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// Standard Scrabble letter distribution (weighted for interesting racks)
const TILE_BAG = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ';

function generateRack(): string {
  const bag = TILE_BAG.split('');
  const rack: string[] = [];
  for (let i = 0; i < 7; i++) {
    const idx = Math.floor(Math.random() * bag.length);
    rack.push(bag.splice(idx, 1)[0]);
  }
  return rack.join('');
}

// GET /api/daily-rack — get today's rack (or create one if none exists)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const today = dateParam || new Date().toISOString().split('T')[0];

  let rack = await db.prepare('SELECT * FROM daily_rack WHERE date = ?').bind(today).first();

  if (!rack) {
    const newRack = generateRack();
    await db.prepare('INSERT INTO daily_rack (date, rack) VALUES (?, ?)').bind(today, newRack).run();
    rack = { date: today, rack: newRack, best_word: '', best_score: 0 };
  }

  const userId = url.searchParams.get('user_id');
  let userScores: any[] = [];
  if (userId) {
    const result = await db.prepare(
      'SELECT word, score FROM daily_rack_scores WHERE date = ? AND user_id = ? ORDER BY score DESC'
    ).bind(today, userId).all();
    userScores = result.results;
  }

  const topScores = await db.prepare(
    'SELECT user_id, word, score FROM daily_rack_scores WHERE date = ? ORDER BY score DESC LIMIT 10'
  ).bind(today).all();

  return new Response(JSON.stringify({
    date: rack.date,
    rack: rack.rack,
    best_word: rack.best_word,
    best_score: rack.best_score,
    userScores,
    topScores: topScores.results,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/daily-rack — submit a word for today's challenge
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, word, score, date } = body;

  if (!word || !score) return new Response(JSON.stringify({ error: 'word and score required' }), { status: 400 });

  const today = date || new Date().toISOString().split('T')[0];

  await db.prepare(
    'INSERT INTO daily_rack_scores (date, user_id, word, score) VALUES (?, ?, ?, ?)'
  ).bind(today, user_id || '', word, score).run();

  const current = await db.prepare('SELECT best_score FROM daily_rack WHERE date = ?').bind(today).first();
  if (current && score > (current.best_score || 0)) {
    await db.prepare('UPDATE daily_rack SET best_word = ?, best_score = ? WHERE date = ?').bind(word, score, today).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
