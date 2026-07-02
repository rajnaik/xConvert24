import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildCabCoachPrompt, CAB_WISDOM } from '../../lib/coaching-prompts';

const getDB = () => (env as any).DB;
const getAI = () => (env as any).AI;

/**
 * POST /api/lex-cab-coach/
 * Lex AI analyses the user's Cows and Bulls history and returns coaching feedback
 * with phase progression, per-game analysis, and attempt graph data.
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

  // Fetch user's CaB game history
  const result = await db.prepare(
    `SELECT s.id, s.solved, s.attempts, s.startDatetime, s.timer_duration, s.split_time, c.word, c.length
     FROM CaB_Scores s JOIN CaB c ON s.wordId = c.id
     WHERE s.user_id = ?
     ORDER BY s.startDatetime DESC
     LIMIT 60`
  ).bind(userId).all();

  const rounds = result.results as any[];

  // If no history, return wisdom without AI call
  if (rounds.length === 0) {
    return new Response(JSON.stringify({
      hasHistory: false,
      analysis: CAB_WISDOM[Math.floor(Math.random() * CAB_WISDOM.length)],
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // ── Compute stats ──
  const totalGames = rounds.length;
  const totalSolved = rounds.filter((r: any) => r.solved === 1).length;
  const solveRate = Math.round((totalSolved / totalGames) * 100);
  const solvedRounds = rounds.filter((r: any) => r.solved === 1 && r.attempts > 0);
  const avgAttempts = solvedRounds.length > 0
    ? (Math.round((solvedRounds.reduce((s: number, r: any) => s + r.attempts, 0) / solvedRounds.length) * 10) / 10).toFixed(1)
    : 'N/A';
  const quickSolves = solvedRounds.filter((r: any) => r.attempts <= 3).length;

  // Preferred word length
  const lengthCounts: Record<number, number> = {};
  rounds.forEach((r: any) => { lengthCounts[r.length] = (lengthCounts[r.length] || 0) + 1; });
  const preferredLengthEntry = Object.entries(lengthCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  const preferredLength = preferredLengthEntry ? `${preferredLengthEntry[0]} letters (${preferredLengthEntry[1]} games)` : 'N/A';

  // Attempt distribution (solved games only)
  const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6+': 0 };
  solvedRounds.forEach((r: any) => {
    const k = r.attempts <= 5 ? String(r.attempts) : '6+';
    dist[k]++;
  });

  // Timing stats
  const timedRounds = rounds.filter((r: any) => r.split_time && r.split_time > 0);
  const avgTime = timedRounds.length > 0
    ? Math.round(timedRounds.reduce((s: number, r: any) => s + r.split_time, 0) / timedRounds.length)
    : 0;

  // ── Phase-based progression (beginning / mid / end) ──
  let phases: any = null;
  let phasePromptSection = '';

  if (totalGames >= 9) {
    const chronological = [...rounds].reverse(); // oldest first
    const third = Math.floor(chronological.length / 3);
    const beginSlice = chronological.slice(0, third);
    const midSlice = chronological.slice(third, third * 2);
    const endSlice = chronological.slice(third * 2);

    const computePhase = (slice: any[]) => {
      const count = slice.length;
      const solved = slice.filter((r: any) => r.solved === 1).length;
      const rate = count > 0 ? Math.round((solved / count) * 100) : 0;
      const solvedInPhase = slice.filter((r: any) => r.solved === 1 && r.attempts > 0);
      const avgAtt = solvedInPhase.length > 0
        ? Math.round((solvedInPhase.reduce((s: number, r: any) => s + r.attempts, 0) / solvedInPhase.length) * 10) / 10
        : 0;
      const quick = solvedInPhase.filter((r: any) => r.attempts <= 3).length;
      const timed = slice.filter((r: any) => r.split_time > 0);
      const avgT = timed.length > 0 ? Math.round(timed.reduce((s: number, r: any) => s + r.split_time, 0) / timed.length) : 0;
      return { count, solved, solveRate: rate, avgAttempts: avgAtt, quickSolves: quick, avgTime: avgT };
    };

    const beginning = computePhase(beginSlice);
    const mid = computePhase(midSlice);
    const end = computePhase(endSlice);

    const rateDelta = end.solveRate - beginning.solveRate;
    const attemptDelta = end.avgAttempts > 0 && beginning.avgAttempts > 0
      ? Math.round((end.avgAttempts - beginning.avgAttempts) * 10) / 10
      : 0;
    let trend: 'improving' | 'declining' | 'stable';
    // For CaB: improving = higher solve rate OR fewer attempts
    if (rateDelta >= 10 || attemptDelta <= -0.5) trend = 'improving';
    else if (rateDelta <= -10 || attemptDelta >= 0.5) trend = 'declining';
    else trend = 'stable';

    phases = { beginning, mid, end, trend, rateDelta, attemptDelta };

    phasePromptSection = `
Phase Progression (${totalGames} games split into thirds chronologically):
- Beginning (first ${beginning.count}): ${beginning.solveRate}% solve rate, avg ${beginning.avgAttempts} attempts, ${beginning.quickSolves} quick solves${beginning.avgTime > 0 ? ', avg ' + beginning.avgTime + 's' : ''}
- Middle (next ${mid.count}): ${mid.solveRate}% solve rate, avg ${mid.avgAttempts} attempts, ${mid.quickSolves} quick solves${mid.avgTime > 0 ? ', avg ' + mid.avgTime + 's' : ''}
- End (last ${end.count}): ${end.solveRate}% solve rate, avg ${end.avgAttempts} attempts, ${end.quickSolves} quick solves${end.avgTime > 0 ? ', avg ' + end.avgTime + 's' : ''}
- Overall trend: ${trend} (${rateDelta >= 0 ? '+' : ''}${rateDelta}% solve rate change, ${attemptDelta >= 0 ? '+' : ''}${attemptDelta} attempts change)
`;
  }

  // ── Per-game analysis ──
  const gameAnalysis = rounds.map((r: any, idx: number) => {
    const solved = r.solved === 1;
    const attempts = r.attempts || 0;
    const splitTime = r.split_time || 0;
    const wordLength = r.length || 0;
    const date = r.startDatetime ? r.startDatetime.split(/[T ]/)[0] : '?';

    // Rating based on attempts (lower = better, like golf)
    let rating: string;
    if (!solved) rating = 'failed';
    else if (attempts === 1) rating = 'ace';
    else if (attempts === 2) rating = 'brilliant';
    else if (attempts === 3) rating = 'great';
    else if (attempts <= 5) rating = 'good';
    else rating = 'tough';

    // Strengths
    const improvements: string[] = [];
    if (attempts === 1 && solved) improvements.push('One-guess solve — incredible instinct');
    if (attempts <= 2 && solved) improvements.push('Solved in ' + attempts + ' — expert-level deduction');
    if (attempts <= 3 && solved) improvements.push('Quick solve — efficient elimination');
    if (splitTime > 0 && splitTime < 60 && solved) improvements.push('Fast solve (' + splitTime + 's) — confident decision-making');
    if (wordLength >= 6 && solved && attempts <= 4) improvements.push('Cracked a ' + wordLength + '-letter word efficiently');
    if (idx > 0 && solved && attempts < (rounds[idx - 1]?.attempts || 99)) improvements.push('Fewer guesses than previous game');

    // Weaknesses
    const weaknesses: string[] = [];
    if (!solved) weaknesses.push('Did not solve — review elimination strategy');
    if (attempts >= 6 && solved) weaknesses.push('Needed ' + attempts + ' guesses — try more systematic letter elimination');
    if (splitTime > 180 && solved) weaknesses.push('Took over 3 minutes — consider tracking eliminated letters more carefully');
    if (wordLength <= 4 && attempts >= 5 && solved) weaknesses.push('Short word but many guesses — focus on vowel placement');

    return {
      gameNumber: totalGames - idx,
      date,
      solved,
      attempts,
      splitTime,
      wordLength,
      word: solved ? r.word : null, // Only show word if solved
      rating,
      improvements,
      weaknesses,
    };
  });

  // ── Build recent plays text for AI prompt ──
  const recent = rounds.slice(0, 10);
  let recentPlays = '\nRecent Games (last ' + recent.length + '):\n';
  recent.forEach((r: any) => {
    const date = r.startDatetime ? r.startDatetime.split(/[T ]/)[0] : '?';
    const result = r.solved === 1 ? 'solved in ' + r.attempts + ' guess' + (r.attempts === 1 ? '' : 'es') : 'not solved';
    const time = r.split_time ? ' · ' + r.split_time + 's' : '';
    const len = r.length ? ' · ' + r.length + '-letter word' : '';
    recentPlays += `${date}${len}: ${result}${time}\n`;
  });

  // ── Build AI prompt ──
  const prompt = buildCabCoachPrompt({
    totalGames,
    totalSolved,
    solveRate,
    avgAttempts,
    quickSolves,
    preferredLength,
    phasePromptSection,
    hasPhases: phases !== null,
    recentPlays,
  });

  try {
    const aiResponse = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const analysis = aiResponse.response || aiResponse.result?.response || 'Unable to generate analysis right now. Keep playing — your stats are being tracked!';

    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, totalSolved, solveRate, avgAttempts, quickSolves, preferredLength, avgTime, dist },
      phases,
      analysis,
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, totalSolved, solveRate, avgAttempts, quickSolves, preferredLength, avgTime, dist },
      phases,
      analysis: getFallbackAnalysis(solveRate, avgAttempts, quickSolves, totalGames),
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};

/** Fallback analysis when AI is unavailable */
function getFallbackAnalysis(solveRate: number, avgAttempts: string, quickSolves: number, totalGames: number): string {
  if (solveRate >= 80) {
    return `Excellent deduction skills! 🏆 Solving ${solveRate}% of games with ${quickSolves} quick solves across ${totalGames} rounds is impressive. Your average of ${avgAttempts} attempts shows efficient letter elimination. To push further, try experimenting with longer words — 6 and 7-letter challenges will sharpen your deduction chains even more. You're operating at a high level!`;
  } else if (solveRate >= 50) {
    return `Good progress, detective! 💪 Solving ${solveRate}% is solid — you clearly understand the elimination strategy. Focus on your opening word: choose one that covers the most common English letters (try STARE, CRANE, or TRAIN). A strong first guess gives you maximum information to work with. ${quickSolves > 0 ? 'Your ' + quickSolves + ' quick solve' + (quickSolves > 1 ? 's show' : ' shows') + ' you can crack it fast when things click.' : ''}`;
  } else {
    return `Every game sharpens your deduction skills! 🌱 The key to Cows and Bulls is systematic elimination — after each guess, think about what each bull and cow tells you about EVERY position. Try keeping a mental note of confirmed letters and their possible positions. Start with STARE or CRANE for maximum letter coverage, then use the feedback to narrow down possibilities step by step.`;
  }
}
