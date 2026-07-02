import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const getDB = () => (env as any).DB;
const GAME_ID = 'daily-duel';

// Standard Scrabble letter values
const LETTER_VALUES: Record<string, number> = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

/** Calculate Scrabble score from word letters — server-side truth */
function scrabbleScore(word: string): number {
  return word.toUpperCase().split('').reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
}

/**
 * GET /api/daily-duel/
 *
 * Returns today's rack (same rack as Daily Rack Challenge — everyone gets the same tiles).
 * Also returns user's submissions for today and the top 10 leaderboard.
 *
 * Query: ?user_id=xxx&date=YYYY-MM-DD (optional date, defaults to today)
 */
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id') || '';
  const today = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Get today's rack (reuse the daily_rack table — same rack for everyone)
  let rack = await db.prepare('SELECT * FROM daily_rack WHERE date = ?').bind(today).first();
  if (!rack) {
    // Generate a new rack if none exists (shouldn't happen with proper seeding)
    const TILE_BAG = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ';
    const bag = TILE_BAG.split('');
    const tiles: string[] = [];
    for (let i = 0; i < 7; i++) {
      const idx = Math.floor(Math.random() * bag.length);
      tiles.push(bag.splice(idx, 1)[0]);
    }
    const newRack = tiles.join('');
    await db.prepare('INSERT INTO daily_rack (date, rack) VALUES (?, ?)').bind(today, newRack).run();
    rack = { date: today, rack: newRack, best_word: '', best_score: 0 };
  }

  // Get user's duel stats for today
  let userStats: any = null;
  if (userId) {
    userStats = await db.prepare(
      'SELECT best_word, best_score, total_score, words_played FROM leaderboard WHERE game = ? AND user_id = ? AND date = ?'
    ).bind(GAME_ID, userId, today).first();
  }

  // Get user's individual word submissions today (from daily_rack_scores)
  let userWords: any[] = [];
  if (userId) {
    const wordResult = await db.prepare(
      'SELECT word, score FROM daily_rack_scores WHERE date = ? AND user_id = ? ORDER BY score DESC'
    ).bind(today, userId).all();
    userWords = wordResult.results || [];
  }

  // Get today's top 10 for quick preview
  const topResult = await db.prepare(`
    SELECT l.user_id, l.best_word, l.best_score, l.total_score, l.words_played,
           u.display_name, u.avatar_id
    FROM leaderboard l
    LEFT JOIN users u ON u.user_id = l.user_id
    WHERE l.game = ? AND l.date = ?
    ORDER BY l.best_score DESC, l.total_score DESC
    LIMIT 10
  `).bind(GAME_ID, today).all();

  const topPlayers = (topResult.results || []).map((row: any, idx: number) => ({
    rank: idx + 1,
    user_id: row.user_id,
    display_name: row.display_name || 'Anonymous',
    avatar_src: row.avatar_id ? `/avatars/avatar-${row.avatar_id}.svg` : '/avatars/avatar-1.svg',
    best_word: row.best_word,
    best_score: row.best_score,
    total_score: row.total_score,
    words_played: row.words_played,
  }));

  // Find user's rank (if they have a score today)
  let userRank: number | null = null;
  if (userId && userStats) {
    const rankResult = await db.prepare(
      'SELECT COUNT(*) as rank FROM leaderboard WHERE game = ? AND date = ? AND (best_score > ? OR (best_score = ? AND total_score > ?))'
    ).bind(GAME_ID, today, userStats.best_score, userStats.best_score, userStats.total_score).first();
    userRank = (rankResult?.rank as number || 0) + 1;
  }

  // Next midnight UTC for cache expiry
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return new Response(JSON.stringify({
    date: today,
    rack: rack.rack,
    userStats: userStats || { best_word: '', best_score: 0, total_score: 0, words_played: 0 },
    userWords,
    userRank,
    topPlayers,
    expiresAt: tomorrow.toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * POST /api/daily-duel/
 *
 * Submit a word for today's Daily Duel. Updates both daily_rack_scores (individual words)
 * and leaderboard (aggregated best_word + total_score).
 *
 * Body: { user_id, word, date? }
 */
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json() as any;
  const { user_id, word } = body;
  const today = body.date || new Date().toISOString().split('T')[0];

  if (!user_id || !word) {
    return new Response(JSON.stringify({ error: 'user_id and word required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upperWord = word.toUpperCase();
  // Server-side score calculation — never trust client score
  const score = scrabbleScore(upperWord);

  // Check for duplicate word submission (same user, same word, same day)
  const existing = await db.prepare(
    'SELECT id FROM daily_rack_scores WHERE date = ? AND user_id = ? AND word = ?'
  ).bind(today, user_id, upperWord).first();

  if (existing) {
    return new Response(JSON.stringify({ error: 'duplicate', message: 'You already submitted this word today' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Insert word into daily_rack_scores
  await db.prepare(
    'INSERT INTO daily_rack_scores (date, user_id, word, score) VALUES (?, ?, ?, ?)'
  ).bind(today, user_id, upperWord, score).run();

  // Update leaderboard aggregate — UPSERT pattern
  const currentEntry = await db.prepare(
    'SELECT best_word, best_score, total_score, words_played FROM leaderboard WHERE game = ? AND user_id = ? AND date = ?'
  ).bind(GAME_ID, user_id, today).first();

  if (currentEntry) {
    // Update existing entry
    const newBestWord = score > (currentEntry.best_score as number) ? upperWord : currentEntry.best_word;
    const newBestScore = Math.max(score, currentEntry.best_score as number);
    const newTotal = (currentEntry.total_score as number) + score;
    const newCount = (currentEntry.words_played as number) + 1;

    await db.prepare(
      "UPDATE leaderboard SET best_word = ?, best_score = ?, total_score = ?, words_played = ?, updated_at = datetime('now') WHERE game = ? AND user_id = ? AND date = ?"
    ).bind(newBestWord, newBestScore, newTotal, newCount, GAME_ID, user_id, today).run();
  } else {
    // Insert new entry
    await db.prepare(
      'INSERT INTO leaderboard (game, user_id, date, best_word, best_score, total_score, words_played) VALUES (?, ?, ?, ?, ?, ?, 1)'
    ).bind(GAME_ID, user_id, today, upperWord, score, score).run();
  }

  // Also update the daily_rack best_word/best_score if this is a new global best
  const globalBest = await db.prepare('SELECT best_score FROM daily_rack WHERE date = ?').bind(today).first();
  if (globalBest && score > (globalBest.best_score as number || 0)) {
    await db.prepare('UPDATE daily_rack SET best_word = ?, best_score = ? WHERE date = ?').bind(upperWord, score, today).run();
  }

  // Get updated rank
  const updatedEntry = await db.prepare(
    'SELECT best_score, total_score FROM leaderboard WHERE game = ? AND user_id = ? AND date = ?'
  ).bind(GAME_ID, user_id, today).first();

  let userRank = 1;
  if (updatedEntry) {
    const rankResult = await db.prepare(
      'SELECT COUNT(*) as rank FROM leaderboard WHERE game = ? AND date = ? AND (best_score > ? OR (best_score = ? AND total_score > ?))'
    ).bind(GAME_ID, today, updatedEntry.best_score, updatedEntry.best_score, updatedEntry.total_score).first();
    userRank = (rankResult?.rank as number || 0) + 1;
  }

  return new Response(JSON.stringify({
    success: true,
    word: upperWord,
    score,
    userRank,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
