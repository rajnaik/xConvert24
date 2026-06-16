import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// GET /api/daily-anagram — get today's puzzle (or by ?date=YYYY-MM-DD)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const today = dateParam || new Date().toISOString().split('T')[0];
  const userId = url.searchParams.get('user_id') || '';

  // Get today's anagram
  const puzzle = await db.prepare('SELECT date, scrambled, hint, word_length FROM daily_anagram WHERE date = ?').bind(today).first();

  if (!puzzle) {
    return new Response(JSON.stringify({ error: 'No puzzle for today', date: today }), { status: 404 });
  }

  // Check if user already played today
  let userResult: any = null;
  if (userId) {
    userResult = await db.prepare(
      'SELECT attempts, solved, guesses, time_taken FROM daily_anagram_scores WHERE date = ? AND user_id = ?'
    ).bind(today, userId).first();
  }

  // Get global stats for today
  const stats = await db.prepare(
    'SELECT COUNT(*) as players, SUM(CASE WHEN solved = 1 THEN 1 ELSE 0 END) as solvers, AVG(attempts) as avg_attempts FROM daily_anagram_scores WHERE date = ?'
  ).bind(today).first();

  // If user already solved, include the answer
  let answer: string | null = null;
  if (userResult && userResult.solved === 1) {
    const full = await db.prepare('SELECT word FROM daily_anagram WHERE date = ?').bind(today).first();
    answer = full?.word || null;
  }

  return new Response(JSON.stringify({
    date: puzzle.date,
    scrambled: puzzle.scrambled,
    hint: puzzle.hint,
    word_length: puzzle.word_length,
    userResult,
    answer,
    stats: {
      players: stats?.players || 0,
      solvers: stats?.solvers || 0,
      avg_attempts: stats?.avg_attempts ? Math.round(stats.avg_attempts * 10) / 10 : 0,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST /api/daily-anagram — submit a guess
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json() as any;
  const { user_id, guess, date: dateParam } = body;

  if (!guess) return new Response(JSON.stringify({ error: 'guess is required' }), { status: 400 });

  const today = dateParam || new Date().toISOString().split('T')[0];
  const normalizedGuess = guess.trim().toUpperCase();

  // Get the actual word
  const puzzle = await db.prepare('SELECT word, scrambled, word_length FROM daily_anagram WHERE date = ?').bind(today).first();
  if (!puzzle) return new Response(JSON.stringify({ error: 'No puzzle for this date' }), { status: 404 });

  const correctWord = puzzle.word;
  const isCorrect = normalizedGuess === correctWord;

  // Build letter-by-letter feedback (Wordle-style)
  // green = correct position, yellow = in word but wrong position, gray = not in word
  const feedback: string[] = [];
  const wordLetters = correctWord.split('');
  const guessLetters = normalizedGuess.split('');
  const used = new Array(wordLetters.length).fill(false);

  // First pass: mark greens
  for (let i = 0; i < guessLetters.length && i < wordLetters.length; i++) {
    if (guessLetters[i] === wordLetters[i]) {
      feedback[i] = 'green';
      used[i] = true;
    }
  }

  // Second pass: mark yellows and grays
  for (let i = 0; i < guessLetters.length && i < wordLetters.length; i++) {
    if (feedback[i]) continue;
    const idx = wordLetters.findIndex((l, j) => l === guessLetters[i] && !used[j]);
    if (idx !== -1) {
      feedback[i] = 'yellow';
      used[idx] = true;
    } else {
      feedback[i] = 'gray';
    }
  }

  // Get or create user score record
  const userId = user_id || '';
  let existing = await db.prepare(
    'SELECT id, attempts, solved, guesses FROM daily_anagram_scores WHERE date = ? AND user_id = ?'
  ).bind(today, userId).first();

  if (existing && existing.solved === 1) {
    // Already solved — don't allow more guesses
    return new Response(JSON.stringify({
      correct: true,
      already_solved: true,
      answer: correctWord,
      feedback,
      attempts: existing.attempts,
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  const prevGuesses = existing ? JSON.parse(existing.guesses || '[]') : [];

  // Check max 5 guesses
  if (prevGuesses.length >= 5 && !isCorrect) {
    return new Response(JSON.stringify({
      correct: false,
      game_over: true,
      answer: correctWord,
      feedback,
      attempts: 5,
      guesses: prevGuesses,
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  prevGuesses.push({ guess: normalizedGuess, feedback });
  const attempts = prevGuesses.length;

  if (existing) {
    await db.prepare(
      'UPDATE daily_anagram_scores SET attempts = ?, solved = ?, guesses = ? WHERE id = ?'
    ).bind(attempts, isCorrect ? 1 : 0, JSON.stringify(prevGuesses), existing.id).run();
  } else {
    await db.prepare(
      'INSERT INTO daily_anagram_scores (date, user_id, attempts, solved, guesses) VALUES (?, ?, ?, ?, ?)'
    ).bind(today, userId, attempts, isCorrect ? 1 : 0, JSON.stringify(prevGuesses)).run();
  }

  const response: any = {
    correct: isCorrect,
    feedback,
    attempts,
    guesses: prevGuesses,
    game_over: attempts >= 5 && !isCorrect,
  };

  if (isCorrect || (attempts >= 5 && !isCorrect)) {
    response.answer = correctWord;
  }

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
};
