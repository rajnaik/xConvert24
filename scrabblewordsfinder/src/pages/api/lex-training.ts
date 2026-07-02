import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  generateBingoChallenge,
  generateTileCountdown,
  getRandomDrill,
  HOOK_QUIZ_WORDS,
  wordScore,
} from '../../lib/training-modes';
import { scoreRack, compareLeaves } from '../../lib/rack-quality';

export const prerender = false;

/**
 * POST /api/lex-training/
 *
 * Training modes for Lex AI coaching.
 *
 * Body: { mode: 'bingo' | 'hooks' | 'countdown' | 'leave-drill', ...params }
 *
 * Each mode returns challenge data for the UI to present to the user.
 * Answers are validated server-side on a follow-up call.
 */
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { mode, action, answer } = body;

  if (!mode) {
    return json({ error: 'mode is required (bingo, hooks, countdown, leave-drill)' }, 400);
  }

  switch (mode) {
    case 'bingo':
      return handleBingoTrainer(body);
    case 'hooks':
      return handleHookQuiz(body);
    case 'countdown':
      return handleTileCountdown(body);
    case 'leave-drill':
      return handleRackLeaveDrill(body);
    default:
      return json({ error: `Unknown mode: ${mode}. Use: bingo, hooks, countdown, leave-drill` }, 400);
  }
};

/**
 * Bingo Trainer — Generate a challenge or validate an answer
 */
async function handleBingoTrainer(body: any) {
  const { action, answer, challengeData } = body;

  if (action === 'validate' && challengeData && answer) {
    // Validate the user's guess against the actual bingos
    const userWord = answer.toUpperCase().replace(/[^A-Z]/g, '');
    const rack = challengeData.rack;

    // Check if the word can be made from the rack
    if (!canMakeFromRack(userWord, rack)) {
      return json({
        correct: false,
        message: `${userWord} can't be made from the rack ${rack}. Check your letters.`,
        bingos: challengeData.bingos,
        stem: challengeData.stem,
      });
    }

    // Check if it's 7 letters (a bingo)
    if (userWord.length !== 7) {
      return json({
        correct: false,
        message: `${userWord} is only ${userWord.length} letters. A bingo must use all 7 tiles.`,
        bingos: challengeData.bingos,
        stem: challengeData.stem,
      });
    }

    // It's a valid 7-letter word from the rack — that's a bingo!
    return json({
      correct: true,
      message: `Excellent! ${userWord} is a bingo (${wordScore(userWord)} + 50 bonus = ${wordScore(userWord) + 50} points). This rack uses the ${challengeData.stem} stem.`,
      bingos: challengeData.bingos,
      stem: challengeData.stem,
      rackQuality: scoreRack(rack).score,
    });
  }

  // Generate a new challenge
  const challenge = generateBingoChallenge();
  const rackQuality = scoreRack(challenge.rack);

  return json({
    challenge: {
      rack: challenge.rack,
      hint: challenge.hint,
      rackQuality: rackQuality.score,
      rackAnalysis: rackQuality.analysis,
    },
    // Store this for validation (client sends it back)
    challengeData: {
      rack: challenge.rack,
      stem: challenge.stem,
      bingos: challenge.bingos,
    },
  });
}

/**
 * Hook Quiz — Generate or validate
 */
async function handleHookQuiz(body: any) {
  const { action, answer, challengeData } = body;
  const db = (env as any).DB;

  if (action === 'validate' && challengeData && answer) {
    const userHooks = answer.toUpperCase().replace(/[^A-Z]/g, '').split('');
    const allCorrectHooks = [...(challengeData.frontHooks || []), ...(challengeData.backHooks || [])];
    const found = userHooks.filter((h: string) => allCorrectHooks.includes(h));
    const missed = allCorrectHooks.filter((h: string) => !userHooks.includes(h));

    const score = allCorrectHooks.length > 0
      ? Math.round((found.length / allCorrectHooks.length) * 100)
      : 0;

    return json({
      score,
      found,
      missed,
      frontHooks: challengeData.frontHooks,
      backHooks: challengeData.backHooks,
      totalHooks: allCorrectHooks.length,
      message: score === 100
        ? `Perfect! You found all ${allCorrectHooks.length} hooks for ${challengeData.word}.`
        : score >= 50
          ? `Good — you found ${found.length}/${allCorrectHooks.length} hooks. Missed: ${missed.join(', ')}.`
          : `You found ${found.length}/${allCorrectHooks.length}. The hooks for ${challengeData.word} are: Front: ${(challengeData.frontHooks || []).join(', ') || 'none'}, Back: ${(challengeData.backHooks || []).join(', ') || 'none'}.`,
    });
  }

  // Generate a new hook quiz challenge
  // Pick a random word from our curated list
  const word = HOOK_QUIZ_WORDS[Math.floor(Math.random() * HOOK_QUIZ_WORDS.length)];

  // We need a dictionary to check hooks — use the DB dictionary table
  let frontHooks: string[] = [];
  let backHooks: string[] = [];

  if (db) {
    try {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      // Check front hooks (letter + word = valid word?)
      for (const letter of alphabet) {
        const frontWord = letter + word;
        const row = await db.prepare('SELECT 1 FROM dictionary WHERE word = ? COLLATE NOCASE LIMIT 1')
          .bind(frontWord).first();
        if (row) frontHooks.push(letter);
      }

      // Check back hooks (word + letter = valid word?)
      for (const letter of alphabet) {
        const backWord = word + letter;
        const row = await db.prepare('SELECT 1 FROM dictionary WHERE word = ? COLLATE NOCASE LIMIT 1')
          .bind(backWord).first();
        if (row) backHooks.push(letter);
      }
    } catch {
      // If dictionary lookup fails, use a minimal set of known hooks
      if (word === 'CAT') { frontHooks = ['S']; backHooks = ['S', 'E']; }
    }
  }

  return json({
    challenge: {
      word,
      wordScore: wordScore(word),
      question: `What single letters can hook onto ${word}? (Front hooks: letter + ${word} = word. Back hooks: ${word} + letter = word.)`,
    },
    challengeData: {
      word,
      frontHooks,
      backHooks,
    },
  });
}

/**
 * Tile Countdown — Generate or validate
 */
async function handleTileCountdown(body: any) {
  const { action, answer, challengeData, difficulty } = body;

  if (action === 'validate' && challengeData && answer !== undefined) {
    const userAnswer = Number(answer);
    const correct = userAnswer === challengeData.correctAnswer;

    return json({
      correct,
      userAnswer,
      correctAnswer: challengeData.correctAnswer,
      targetLetter: challengeData.targetLetter,
      message: correct
        ? `Correct! There are ${challengeData.correctAnswer} ${challengeData.targetLetter} tiles remaining.`
        : `Not quite. There are ${challengeData.correctAnswer} ${challengeData.targetLetter} tiles left (started with ${getTileBagCount(challengeData.targetLetter)}, used ${getTileBagCount(challengeData.targetLetter) - challengeData.correctAnswer}).`,
    });
  }

  // Generate challenge
  const challenge = generateTileCountdown(difficulty || 'medium');

  return json({
    challenge: {
      wordsPlayed: challenge.wordsPlayed,
      question: challenge.question,
      difficulty: challenge.difficulty,
    },
    challengeData: {
      correctAnswer: challenge.correctAnswer,
      targetLetter: challenge.targetLetter,
      totalRemaining: challenge.totalRemaining,
    },
  });
}

/**
 * Rack Leave Drill — Generate or validate
 */
async function handleRackLeaveDrill(body: any) {
  const { action, answer, challengeData } = body;

  if (action === 'validate' && challengeData && answer !== undefined) {
    const userChoice = Number(answer);
    const correct = userChoice === challengeData.bestChoice;
    const leaves = compareLeaves(challengeData.rack, challengeData.candidates.map((c: any) => c.word));

    return json({
      correct,
      userChoice,
      bestChoice: challengeData.bestChoice,
      explanation: challengeData.explanation,
      leaveAnalysis: leaves,
      message: correct
        ? `Correct! ${challengeData.explanation}`
        : `Not quite. The best play is #${challengeData.bestChoice + 1}. ${challengeData.explanation}`,
    });
  }

  // Generate challenge
  const drill = getRandomDrill();

  return json({
    challenge: {
      rack: drill.rack,
      rackQuality: scoreRack(drill.rack).score,
      candidates: drill.candidates.map((c, i) => ({
        index: i,
        word: c.word,
        score: c.score,
        leave: c.leave,
      })),
      question: `Given rack ${drill.rack}, which play would you choose?`,
    },
    challengeData: {
      rack: drill.rack,
      candidates: drill.candidates,
      bestChoice: drill.bestChoice,
      explanation: drill.explanation,
    },
  });
}

/** Helper: check if a word can be made from a rack */
function canMakeFromRack(word: string, rack: string): boolean {
  const available = rack.toUpperCase().split('');
  for (const ch of word.toUpperCase()) {
    const idx = available.indexOf(ch);
    if (idx >= 0) {
      available.splice(idx, 1);
    } else {
      const blankIdx = available.indexOf('?');
      if (blankIdx >= 0) {
        available.splice(blankIdx, 1);
      } else {
        return false;
      }
    }
  }
  return true;
}

/** Get tile count from standard bag */
function getTileBagCount(letter: string): number {
  const bag: Record<string, number> = {
    A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1,
    L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2,
    W: 2, X: 1, Y: 2, Z: 1,
  };
  return bag[letter.toUpperCase()] || 0;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Reject non-POST methods
export const GET: APIRoute = async () => {
  return json({ error: 'Method not allowed. Use POST.' }, 405);
};
