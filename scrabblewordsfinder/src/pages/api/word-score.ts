import type { APIRoute } from 'astro';

/**
 * GET /api/word-score/?word=BUZZARD
 * Returns the exact Scrabble tile score for any word.
 * Used by Lex AI to avoid hallucinating scores.
 * 
 * Params:
 *   word (required) — the word to score (case-insensitive)
 *   words (optional) — comma-separated list of words to score in batch
 * 
 * Response:
 *   { word, score, breakdown, letters }
 *   or { words: [{word, score, breakdown}...] } for batch
 */

const TILE_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

function scoreWord(word: string): { word: string; score: number; breakdown: string; letters: number } {
  const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
  const parts = upper.split('').map(c => `${c}(${TILE_VALUES[c] || 0})`);
  const score = upper.split('').reduce((sum, c) => sum + (TILE_VALUES[c] || 0), 0);
  return {
    word: upper,
    score,
    breakdown: parts.join(' + ') + ` = ${score}`,
    letters: upper.length,
  };
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const word = url.searchParams.get('word');
  const words = url.searchParams.get('words');

  if (words) {
    // Batch mode: score multiple words
    const list = words.split(',').slice(0, 50).map(w => w.trim()).filter(Boolean);
    const results = list.map(scoreWord);
    return new Response(JSON.stringify({ words: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!word) {
    return new Response(JSON.stringify({ error: 'Missing ?word= parameter' }), { status: 400 });
  }

  const result = scoreWord(word);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
};
