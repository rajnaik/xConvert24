import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildAnagramCoachPrompt, ANAGRAM_WISDOM } from '../../lib/coaching-prompts';
import { sanitizeChallenge } from '../../lib/sanitize-challenge';
import { logAiUsage } from '../../lib/log-ai-usage';

const getDB = () => (env as any).DB;
const getAI = () => (env as any).AI;

/**
 * POST /api/lex-anagram-coach/
 * Lex AI analyses the user's Daily Anagram history and returns coaching feedback
 * with phase progression, per-game analysis, timing data, and graph data.
 */
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  const ai = getAI();

  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });
  if (!ai) return new Response(JSON.stringify({ error: 'AI not available' }), { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const userId = body.user_id;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });
  }

  // Fetch user's anagram history (up to 60 games for phase analysis)
  const result = await db.prepare(
    'SELECT date, attempts, solved, guesses, time_taken FROM daily_anagram_scores WHERE user_id = ? ORDER BY date DESC LIMIT 60'
  ).bind(userId).all();

  const scores = result.results as any[];

  // If no history, return wisdom without AI call
  if (scores.length === 0) {
    return new Response(JSON.stringify({
      hasHistory: false,
      analysis: ANAGRAM_WISDOM[Math.floor(Math.random() * ANAGRAM_WISDOM.length)],
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Fetch puzzle data for recent games (word, scrambled, hint)
  const gameDates = scores.map((s: any) => s.date).filter(Boolean);
  let puzzles: Record<string, any> = {};
  if (gameDates.length > 0) {
    const placeholders = gameDates.map(() => '?').join(',');
    const puzzleRows = await db.prepare(
      `SELECT date, word, scrambled, hint, word_length FROM daily_anagram WHERE date IN (${placeholders})`
    ).bind(...gameDates).all();
    for (const row of puzzleRows.results as any[]) {
      puzzles[(row as any).date] = row;
    }
  }

  // ── Compute stats ──
  const totalGames = scores.length;
  const totalSolved = scores.filter((s: any) => s.solved === 1).length;
  const solveRate = Math.round((totalSolved / totalGames) * 100);
  const avgAttempts = Math.round((scores.reduce((sum: number, s: any) => sum + s.attempts, 0) / totalGames) * 10) / 10;
  const timedScores = scores.filter((s: any) => s.time_taken > 0);
  const avgTime = timedScores.length > 0
    ? Math.round(timedScores.reduce((sum: number, s: any) => sum + s.time_taken, 0) / timedScores.length)
    : 0;

  // Current streak
  let streak = 0;
  for (const s of scores) {
    if (s.solved === 1) streak++;
    else break;
  }

  // Attempt distribution
  const in1 = scores.filter((s: any) => s.solved === 1 && s.attempts === 1).length;
  const in2 = scores.filter((s: any) => s.solved === 1 && s.attempts === 2).length;
  const in3 = scores.filter((s: any) => s.solved === 1 && s.attempts === 3).length;
  const in4 = scores.filter((s: any) => s.solved === 1 && s.attempts === 4).length;
  const in5 = scores.filter((s: any) => s.solved === 1 && s.attempts === 5).length;
  const failed = scores.filter((s: any) => s.solved !== 1).length;

  // Recent trend (last 5 games)
  const recent5 = scores.slice(0, 5);
  const recent5Solved = recent5.filter((s: any) => s.solved === 1).length;

  // ── Phase-based progression (beginning / mid / end) ──
  let phases: any = null;
  let phasePromptSection = '';

  if (totalGames >= 9) {
    const chronological = [...scores].reverse(); // oldest first
    const third = Math.floor(chronological.length / 3);
    const beginSlice = chronological.slice(0, third);
    const midSlice = chronological.slice(third, third * 2);
    const endSlice = chronological.slice(third * 2);

    const computePhase = (slice: any[]) => {
      const count = slice.length;
      const solved = slice.filter((s: any) => s.solved === 1).length;
      const rate = count > 0 ? Math.round((solved / count) * 100) : 0;
      const avgAtt = count > 0 ? Math.round((slice.reduce((s: number, g: any) => s + g.attempts, 0) / count) * 10) / 10 : 0;
      const timed = slice.filter((s: any) => s.time_taken > 0);
      const avgT = timed.length > 0 ? Math.round(timed.reduce((s: number, g: any) => s + g.time_taken, 0) / timed.length) : 0;
      return { count, solved, solveRate: rate, avgAttempts: avgAtt, avgTime: avgT };
    };

    const beginning = computePhase(beginSlice);
    const mid = computePhase(midSlice);
    const end = computePhase(endSlice);

    const rateDelta = end.solveRate - beginning.solveRate;
    const attemptDelta = end.avgAttempts - beginning.avgAttempts;
    let trend: 'improving' | 'declining' | 'stable';
    if (rateDelta >= 10 || attemptDelta <= -0.5) trend = 'improving';
    else if (rateDelta <= -10 || attemptDelta >= 0.5) trend = 'declining';
    else trend = 'stable';

    phases = { beginning, mid, end, trend, rateDelta, attemptDelta };

    phasePromptSection = `
Phase Progression (${totalGames} puzzles split into thirds chronologically):
- Beginning (first ${beginning.count}): ${beginning.solveRate}% solve rate, avg ${beginning.avgAttempts} attempts${beginning.avgTime > 0 ? ', avg ' + beginning.avgTime + 's' : ''}
- Middle (next ${mid.count}): ${mid.solveRate}% solve rate, avg ${mid.avgAttempts} attempts${mid.avgTime > 0 ? ', avg ' + mid.avgTime + 's' : ''}
- End (last ${end.count}): ${end.solveRate}% solve rate, avg ${end.avgAttempts} attempts${end.avgTime > 0 ? ', avg ' + end.avgTime + 's' : ''}
- Overall trend: ${trend} (${rateDelta >= 0 ? '+' : ''}${rateDelta}% solve rate change, ${attemptDelta >= 0 ? '+' : ''}${attemptDelta} attempts change)
`;
  }

  // ── Per-game analysis ──
  const gameAnalysis = scores.map((s: any, idx: number) => {
    const solved = s.solved === 1;
    const attempts = s.attempts || 0;
    const timeTaken = s.time_taken || 0;
    const date = s.date || '?';
    const puzzle = puzzles[date] || null;

    // Rating based on attempts (lower = better)
    let rating: string;
    if (!solved) rating = 'failed';
    else if (attempts === 1) rating = 'genius';
    else if (attempts === 2) rating = 'excellent';
    else if (attempts === 3) rating = 'good';
    else if (attempts === 4) rating = 'fair';
    else rating = 'close';

    // Compute strengths
    const improvements: string[] = [];
    if (attempts === 1 && solved) improvements.push('First-try solve — pure instinct');
    if (attempts <= 2 && solved) improvements.push('Efficient deduction with minimal guesses');
    if (timeTaken > 0 && timeTaken < 30 && solved) improvements.push('Very fast solve (' + timeTaken + 's) — strong pattern recognition');
    if (idx > 0 && solved && attempts < (scores[idx - 1]?.attempts || 99)) improvements.push('Fewer attempts than previous puzzle');

    // Compute weaknesses
    const weaknesses: string[] = [];
    if (!solved) weaknesses.push('Did not solve — review word structure after reveal');
    if (attempts >= 4 && solved) weaknesses.push('Needed ' + attempts + ' attempts — try identifying prefixes/suffixes earlier');
    if (timeTaken > 120 && solved) weaknesses.push('Took over 2 minutes — might be overthinking');
    if (idx > 0 && solved && attempts > (scores[idx - 1]?.attempts || 0) + 1) weaknesses.push('More attempts than previous — possible harder word');

    return {
      gameNumber: totalGames - idx,
      date,
      solved,
      attempts,
      timeTaken,
      rating,
      word: puzzle ? puzzle.word : null,
      scrambled: puzzle ? puzzle.scrambled : null,
      wordLength: puzzle ? puzzle.word_length : null,
      improvements,
      weaknesses,
    };
  });

  // ── Build recent plays text for AI prompt ──
  const recent = scores.slice(0, 10);
  let recentPlays = '\nRecent Puzzles (last ' + recent.length + '):\n';
  recent.forEach((s: any) => {
    const puzzle = puzzles[s.date];
    const word = puzzle ? puzzle.word : '?';
    const scrambled = puzzle ? ' (scrambled: ' + puzzle.scrambled + ')' : '';
    const result = s.solved === 1 ? 'solved in ' + s.attempts + ' attempt' + (s.attempts === 1 ? '' : 's') : 'failed';
    const time = s.time_taken > 0 ? ' · ' + s.time_taken + 's' : '';
    recentPlays += `${s.date}${scrambled}: ${word} — ${result}${time}\n`;
  });

  // ── Build AI prompt ──
  const prompt = buildAnagramCoachPrompt({
    totalGames,
    totalSolved,
    solveRate,
    avgAttempts,
    avgTime,
    streak,
    recent5Solved,
    phasePromptSection,
    hasPhases: phases !== null,
    recentPlays,
  });

  try {
    const aiResponse = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    let analysis = aiResponse.response || aiResponse.result?.response || 'Unable to generate analysis right now. Keep playing — your stats are being tracked!';

    // Post-process: fix impossible challenges the AI sometimes generates
    analysis = sanitizeChallenge(analysis);

    await logAiUsage(db, { userId, source: 'anagram-coach', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', responseLength: analysis.length });

    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, totalSolved, solveRate, avgAttempts, avgTime, streak, in1, in2, in3, in4, in5, failed },
      phases,
      analysis,
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    // Fallback if AI call fails
    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, totalSolved, solveRate, avgAttempts, avgTime, streak, in1, in2, in3, in4, in5, failed },
      phases,
      analysis: getFallbackAnalysis(solveRate, avgAttempts, streak),
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};

/** Fallback analysis when AI is unavailable */
function getFallbackAnalysis(solveRate: number, avgAttempts: number, streak: number): string {
  if (solveRate >= 80) {
    return `Impressive work! 🏆 You're solving ${solveRate}% of puzzles with an average of ${avgAttempts} attempts. Your pattern recognition is sharp. To push even further, try solving in fewer attempts by looking for common word endings (-TION, -NESS, -MENT) before guessing. Keep that ${streak > 0 ? streak + '-day streak' : 'momentum'} going!`;
  } else if (solveRate >= 50) {
    return `Solid progress! 💪 You're solving more than half the puzzles — that shows real word knowledge. Try this: before your first guess, mentally group the vowels and consonants. This helps you see possible syllable structures faster. You've got the vocabulary — now train the speed! ${streak > 0 ? '🔥 ' + streak + '-day streak!' : ''}`;
  } else {
    return `Every puzzle is practice! 🌱 You're building your anagram muscles with each attempt. Here's a technique: start with the most common English letters (E, T, A, O, I, N, S) and try to form a 2-3 letter word fragment. Then build outward. Rome wasn't unscrambled in a day — keep at it!`;
  }
}
