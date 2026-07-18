import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

// PUT /api/cab — Evaluate a guess
// Body: { gameId, wordId, guess, guessNumber?: number }
// Returns: { bulls, cows, feedback, word? (only if solved) }
export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    const body = await request.json();
    const { gameId, wordId, guess, guessNumber, split_time } = body;

    if (!gameId || !wordId || !guess) {
      return new Response(JSON.stringify({ error: 'Missing gameId, wordId, or guess.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the actual word
    const wordRow = await db.prepare("SELECT word FROM CaB WHERE id = ?").bind(wordId).first();
    if (!wordRow) {
      return new Response(JSON.stringify({ error: 'Word not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const secret = wordRow.word.toUpperCase();
    const guessUpper = guess.toUpperCase();

    if (guessUpper.length !== secret.length) {
      return new Response(JSON.stringify({ error: 'Guess must be ' + secret.length + ' letters.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate bulls and cows
    let bulls = 0;
    let cows = 0;
    const secretArr = secret.split('');
    const guessArr = guessUpper.split('');
    const secretUsed = new Array(secret.length).fill(false);
    const guessUsed = new Array(secret.length).fill(false);

    // First pass: find bulls (exact position matches)
    for (let i = 0; i < secret.length; i++) {
      if (guessArr[i] === secretArr[i]) {
        bulls++;
        secretUsed[i] = true;
        guessUsed[i] = true;
      }
    }

    // Second pass: find cows (right letter, wrong position)
    for (let i = 0; i < guessArr.length; i++) {
      if (guessUsed[i]) continue;
      for (let j = 0; j < secretArr.length; j++) {
        if (secretUsed[j]) continue;
        if (guessArr[i] === secretArr[j]) {
          cows++;
          secretUsed[j] = true;
          break;
        }
      }
    }

    const solved = bulls === secret.length;

    // Build per-letter feedback array: 'bull' | 'cow' | 'miss'
    const feedback: string[] = new Array(secret.length).fill('miss');
    for (let i = 0; i < secret.length; i++) {
      if (guessArr[i] === secretArr[i]) {
        feedback[i] = 'bull';
      }
    }
    // Mark cows (reuse the same logic but track separately for feedback)
    const secretUsedFb = new Array(secret.length).fill(false);
    const guessUsedFb = new Array(secret.length).fill(false);
    for (let i = 0; i < secret.length; i++) {
      if (guessArr[i] === secretArr[i]) {
        secretUsedFb[i] = true;
        guessUsedFb[i] = true;
      }
    }
    for (let i = 0; i < guessArr.length; i++) {
      if (guessUsedFb[i]) continue;
      for (let j = 0; j < secretArr.length; j++) {
        if (secretUsedFb[j]) continue;
        if (guessArr[i] === secretArr[j]) {
          feedback[i] = 'cow';
          secretUsedFb[j] = true;
          break;
        }
      }
    }

    // Store the guess in CaB_Guesses
    const gNum = guessNumber || 1;
    await db.prepare(
      "INSERT INTO CaB_Guesses (game_id, guess_number, guess, bulls, cows, feedback) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(gameId, gNum, guessUpper, bulls, cows, JSON.stringify(feedback)).run();

    // If solved, update CaB_Scores with solved=1, total attempts, and split_time
    if (solved) {
      const splitTime = split_time != null ? Number(split_time) : null;
      await db.prepare(
        "UPDATE CaB_Scores SET solved = 1, attempts = ?, split_time = ? WHERE id = ?"
      ).bind(gNum, splitTime, gameId).run();
    } else {
      // Update attempts count (tracks highest guess number so far)
      await db.prepare(
        "UPDATE CaB_Scores SET attempts = ? WHERE id = ? AND attempts < ?"
      ).bind(gNum, gameId, gNum).run();
    }

    return new Response(JSON.stringify({
      bulls,
      cows,
      feedback,
      ...(solved ? { word: secret } : {})
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/cab — Start a new Cows and Bulls game
// Body: { length: 4|5|6|7, user_id?: string }
// Returns: { gameId, length }
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).DB;
    const body = await request.json();
    const length = Number(body.length);
    const userId = body.user_id || '';
    const timerDuration = body.timer_duration ? Number(body.timer_duration) : null;

    if (![4, 5, 6, 7].includes(length)) {
      return new Response(JSON.stringify({ error: 'Invalid length. Must be 4, 5, 6, or 7.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // MWB mode: client provides the word, we just create a game record
    const mwbWord = body.mwb_word || '';
    if (mwbWord) {
      // Insert a special CaB row for this MWB word (or reuse wordId=0)
      // First check if word exists in CaB table
      let wordId = 0;
      const existing = await db.prepare("SELECT id FROM CaB WHERE UPPER(word) = UPPER(?) LIMIT 1").bind(mwbWord).first();
      if (existing) {
        wordId = existing.id;
      } else {
        // Insert it as a temporary word
        const ins = await db.prepare("INSERT INTO CaB (word, length, status) VALUES (?, ?, 'mwb')").bind(mwbWord.toUpperCase(), mwbWord.length).run();
        wordId = ins.meta.last_row_id;
      }

      const insertResult = await db.prepare(
        "INSERT INTO CaB_Scores (wordId, user_id, timer_duration) VALUES (?, ?, ?)"
      ).bind(wordId, userId, timerDuration).run();

      return new Response(JSON.stringify({
        gameId: insertResult.meta.last_row_id,
        length: mwbWord.length,
        wordId: wordId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Pick a random word of the requested length
    const wordResult = await db.prepare(
      "SELECT id, word FROM CaB WHERE length = ? AND status = 'active' ORDER BY RANDOM() LIMIT 1"
    ).bind(length).first();

    if (!wordResult) {
      return new Response(JSON.stringify({ error: 'No words available for this length.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert a new game session into CaB_Scores with user_id and timer_duration
    const insertResult = await db.prepare(
      "INSERT INTO CaB_Scores (wordId, user_id, timer_duration) VALUES (?, ?, ?)"
    ).bind(wordResult.id, userId, timerDuration).run();

    const gameId = insertResult.meta.last_row_id;

    return new Response(JSON.stringify({
      gameId,
      length,
      wordId: wordResult.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// GET /api/cab — Retrieve user history or round details
// ?user_id=xxx — returns all rounds for that user (history)
// ?round=gameId — returns all guesses for a specific round (inspect)
export const GET: APIRoute = async ({ url }) => {
  try {
    const db = (env as any).DB;
    const userId = url.searchParams.get('user_id');
    const roundId = url.searchParams.get('round');

    // Inspect mode: return all guesses for a specific game round
    if (roundId) {
      const guesses = await db.prepare(
        "SELECT guess_number, guess, bulls, cows, feedback FROM CaB_Guesses WHERE game_id = ? ORDER BY guess_number ASC"
      ).bind(Number(roundId)).all();

      // Also get the game info (word, solved status, timer info)
      const game = await db.prepare(
        `SELECT s.id, s.solved, s.attempts, s.startDatetime, s.timer_duration, s.split_time, c.word, c.length
         FROM CaB_Scores s JOIN CaB c ON s.wordId = c.id
         WHERE s.id = ?`
      ).bind(Number(roundId)).first();

      return new Response(JSON.stringify({
        game: game || null,
        guesses: guesses?.results || []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // History mode: return all rounds for a user
    if (userId) {
      const rounds = await db.prepare(
        `SELECT s.id, s.solved, s.attempts, s.startDatetime, s.timer_duration, s.split_time, c.word, c.length
         FROM CaB_Scores s JOIN CaB c ON s.wordId = c.id
         WHERE s.user_id = ?
         ORDER BY s.startDatetime DESC
         LIMIT 50`
      ).bind(userId).all();

      return new Response(JSON.stringify({
        rounds: rounds?.results || [],
        count: rounds?.results?.length || 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Provide user_id or round parameter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
