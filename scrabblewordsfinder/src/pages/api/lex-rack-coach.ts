import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildRackCoachPrompt, RACK_WISDOM } from '../../lib/coaching-prompts';
import { sanitizeChallenge } from '../../lib/sanitize-challenge';
import { logAiUsage } from '../../lib/log-ai-usage';

const getDB = () => (env as any).DB;
const getAI = () => (env as any).AI;

/**
 * POST /api/lex-rack-coach/
 * Lex AI analyses the user's Daily Rack Challenge history and returns coaching feedback
 * with phase progression, per-game analysis, and score graph data.
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

  // Fetch user's full rack history
  const result = await db.prepare(
    'SELECT word, score, meaning, submitted_at FROM rack_history WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 200'
  ).bind(userId).all();

  const history = result.results as any[];

  // If no history, return wisdom without AI call
  if (history.length === 0) {
    return new Response(JSON.stringify({
      hasHistory: false,
      analysis: RACK_WISDOM[Math.floor(Math.random() * RACK_WISDOM.length)],
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Fetch rack tiles for each unique date
  const dates = [...new Set(history.map((r: any) => {
    if (!r.submitted_at) return null;
    return r.submitted_at.split(/[T ]/)[0];
  }).filter(Boolean))];

  let racks: Record<string, string> = {};
  if (dates.length > 0) {
    const placeholders = dates.map(() => '?').join(',');
    const rackRows = await db.prepare(
      `SELECT date, rack, best_word, best_score FROM daily_rack WHERE date IN (${placeholders})`
    ).bind(...dates).all();
    for (const row of rackRows.results as any[]) {
      racks[(row as any).date] = (row as any).rack;
    }
  }

  // ── Compute stats ──
  const totalWords = history.length;
  const totalScore = history.reduce((s: number, h: any) => s + (h.score || 0), 0);
  const avgScore = totalWords > 0 ? Math.round(totalScore / totalWords) : 0;
  const bingos = history.filter((h: any) => h.word && h.word.length === 7).length;
  const highWord = history.reduce((best: any, h: any) => (!best || h.score > best.score) ? h : best, null);
  const uniqueDays = new Set(history.map((h: any) => h.submitted_at ? h.submitted_at.split(/[T ]/)[0] : null).filter(Boolean)).size;

  // Score distribution
  const below10 = history.filter((h: any) => h.score < 10).length;
  const tenTo20 = history.filter((h: any) => h.score >= 10 && h.score < 20).length;
  const above20 = history.filter((h: any) => h.score >= 20).length;

  // ── Phase-based progression (beginning / mid / end) ──
  let phases: any = null;
  let phasePromptSection = '';

  if (totalWords >= 9) {
    const chronological = [...history].reverse(); // oldest first
    const third = Math.floor(chronological.length / 3);
    const beginSlice = chronological.slice(0, third);
    const midSlice = chronological.slice(third, third * 2);
    const endSlice = chronological.slice(third * 2);

    const computePhase = (slice: any[]) => {
      const count = slice.length;
      const total = slice.reduce((s: number, h: any) => s + (h.score || 0), 0);
      const avg = count > 0 ? Math.round(total / count) : 0;
      const bingosInPhase = slice.filter((h: any) => h.word && h.word.length === 7).length;
      const maxScore = Math.max(...slice.map((h: any) => h.score || 0));
      return { count, avgScore: avg, bingos: bingosInPhase, maxScore };
    };

    const beginning = computePhase(beginSlice);
    const mid = computePhase(midSlice);
    const end = computePhase(endSlice);

    const scoreDelta = end.avgScore - beginning.avgScore;
    let trend: 'improving' | 'declining' | 'stable';
    if (scoreDelta >= 3) trend = 'improving';
    else if (scoreDelta <= -3) trend = 'declining';
    else trend = 'stable';

    phases = { beginning, mid, end, trend, scoreDelta };

    phasePromptSection = `
Phase Progression (${totalWords} submissions split into thirds chronologically):
- Beginning (first ${beginning.count}): avg ${beginning.avgScore} pts, ${beginning.bingos} bingos, best ${beginning.maxScore} pts
- Middle (next ${mid.count}): avg ${mid.avgScore} pts, ${mid.bingos} bingos, best ${mid.maxScore} pts
- End (last ${end.count}): avg ${end.avgScore} pts, ${end.bingos} bingos, best ${end.maxScore} pts
- Overall trend: ${trend} (${scoreDelta >= 0 ? '+' : ''}${scoreDelta} pts avg change from beginning to end)
`;
  }

  // ── Per-game analysis ──
  const gameAnalysis = history.map((h: any, idx: number) => {
    const score = h.score || 0;
    const wordLen = h.word ? h.word.length : 0;
    const isBingo = wordLen === 7;
    const date = h.submitted_at ? h.submitted_at.split(/[T ]/)[0] : '?';
    const rack = racks[date] || '';

    // Rating based on score
    let rating: string;
    if (score >= 30) rating = 'excellent';
    else if (score >= 20) rating = 'great';
    else if (score >= 12) rating = 'good';
    else if (score >= 7) rating = 'fair';
    else rating = 'weak';

    // Compute strengths
    const improvements: string[] = [];
    if (isBingo) improvements.push('Found a 7-letter bingo — maximum rack utilisation');
    if (score >= 25) improvements.push('High-value word — strong tile awareness');
    if (wordLen >= 6 && !isBingo) improvements.push('Long word (' + wordLen + ' letters) — good pattern recognition');
    if (idx > 0 && score > (history[idx - 1]?.score || 0)) improvements.push('Score improved from previous submission');

    // Compute weaknesses
    const weaknesses: string[] = [];
    if (score < 7 && rack) weaknesses.push('Low score — rack may have had higher-value words');
    if (wordLen <= 3) weaknesses.push('Very short word — look for longer combinations');
    if (idx > 0 && score < (history[idx - 1]?.score || 0) - 10) weaknesses.push('Score dropped significantly from previous play');

    return {
      gameNumber: totalWords - idx,
      word: h.word || '?',
      score,
      wordLength: wordLen,
      meaning: h.meaning || '',
      rack,
      date,
      isBingo,
      rating,
      improvements,
      weaknesses,
    };
  });

  // ── Build recent plays text for the AI prompt ──
  const recent = history.slice(0, 10);
  let recentPlays = '\nRecent Plays (last ' + recent.length + '):\n';
  recent.forEach((h: any) => {
    const date = h.submitted_at ? h.submitted_at.split(/[T ]/)[0] : '?';
    const rack = racks[date] ? ' (rack: ' + racks[date] + ')' : '';
    recentPlays += `${date}${rack}: ${h.word || '?'} = ${h.score || 0} pts\n`;
  });

  // ── Build AI prompt ──
  const prompt = buildRackCoachPrompt({
    totalWords,
    daysPlayed: uniqueDays,
    avgScore,
    totalScore,
    bingos,
    highWord: highWord ? { word: highWord.word, score: highWord.score } : null,
    below10,
    tenTo20,
    above20,
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

    const analysis = sanitizeChallenge(aiResponse.response || aiResponse.result?.response || 'Unable to generate analysis right now. Keep playing — your stats are being tracked!');

    await logAiUsage(db, { userId, source: 'rack-coach', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', responseLength: analysis.length });

    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalWords, daysPlayed: uniqueDays, avgScore, totalScore, bingos, below10, tenTo20, above20, highWord: highWord ? { word: highWord.word, score: highWord.score } : null },
      phases,
      analysis,
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    // Fallback if AI call fails
    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalWords, daysPlayed: uniqueDays, avgScore, totalScore, bingos, below10, tenTo20, above20, highWord: highWord ? { word: highWord.word, score: highWord.score } : null },
      phases,
      analysis: getFallbackAnalysis(avgScore, bingos, totalWords),
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};

/** Fallback analysis when AI is unavailable */
function getFallbackAnalysis(avgScore: number, bingos: number, totalWords: number): string {
  if (avgScore >= 20) {
    return `Outstanding rack mastery! 🏆 Averaging ${avgScore} points per word with ${bingos} bingos across ${totalWords} submissions shows you have serious pattern recognition skills. You're consistently finding the high-value plays. To push even further, look for uncommon 2-letter combos that unlock positions (QI, ZA, XU). Keep dominating those racks!`;
  } else if (avgScore >= 12) {
    return `Solid rack solving! 💪 Averaging ${avgScore} points means you're finding decent words consistently. ${bingos > 0 ? `Plus ${bingos} bingo${bingos > 1 ? 's' : ''} — that's great.` : 'Try hunting for those 7-letter bingos — even one is a huge achievement.'} Focus on high-value tiles next: when you spot Z, X, Q, or J in your rack, build around them first. They can turn a 10-point word into a 25-pointer!`;
  } else {
    return `Every rack is a puzzle waiting to be cracked! 🌱 With ${totalWords} submissions, you're building your word-finding instincts. Try this: look for -ING, -ED, or -ER endings first — they're the most common paths to longer words. Longer words almost always score more than short ones, so spend an extra moment looking before submitting. Your pattern recognition will sharpen with each attempt!`;
  }
}
