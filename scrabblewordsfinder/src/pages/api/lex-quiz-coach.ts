import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { buildQuizCoachPrompt } from '../../lib/coaching-prompts';

const getDB = () => (env as any).DB;
const getAI = () => (env as any).AI;

/**
 * POST /api/lex-quiz-coach/
 * Lex AI analyses the user's Word Quiz history and returns coaching feedback.
 * If no history exists, returns motivational wisdom for first-time players.
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

  // Fetch user's full quiz history (all games)
  const result = await db.prepare(
    'SELECT score, total, time_used, timer_limit, timed_out, details, created_at FROM quiz_scores WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all();

  const scores = result.results as any[];

  // If no history, return wisdom without AI call
  if (scores.length === 0) {
    return new Response(JSON.stringify({
      hasHistory: false,
      analysis: getWisdom(),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Compute stats for AI prompt
  const totalGames = scores.length;
  const totalPerfect = scores.filter((s: any) => s.score === s.total).length;
  const totalTimedOut = scores.filter((s: any) => s.timed_out === 1).length;
  const avgScore = Math.round((scores.reduce((sum: number, s: any) => sum + s.score, 0) / totalGames) * 10) / 10;
  const avgTotal = Math.round((scores.reduce((sum: number, s: any) => sum + s.total, 0) / totalGames) * 10) / 10;
  const accuracy = Math.round((scores.reduce((sum: number, s: any) => sum + s.score, 0) / scores.reduce((sum: number, s: any) => sum + s.total, 0)) * 100);
  const avgTime = Math.round(scores.reduce((sum: number, s: any) => sum + (s.time_used || 0), 0) / totalGames);
  const avgTimerLimit = Math.round(scores.reduce((sum: number, s: any) => sum + (s.timer_limit || 90), 0) / totalGames);

  // Find most-missed words from details
  const missedWords: string[] = [];
  for (const s of scores.slice(0, 10)) {
    if (s.details) {
      try {
        const details = typeof s.details === 'string' ? JSON.parse(s.details) : s.details;
        for (const d of details) {
          if (!d.correct) missedWords.push(d.word);
        }
      } catch {}
    }
  }

  // Recent trend (last 5 games)
  const recent5 = scores.slice(0, 5);
  const recent5Accuracy = recent5.length > 0
    ? Math.round((recent5.reduce((sum: number, s: any) => sum + s.score, 0) / recent5.reduce((sum: number, s: any) => sum + s.total, 0)) * 100)
    : 0;

  // ── Phase-based progression analysis (beginning / mid / end) ──
  // Only computed when 10+ games exist. Scores are DESC (newest first), so
  // chronologically: end = scores[0..endSize], mid = middle, beginning = oldest.
  let phases: any = null;
  let phasePromptSection = '';

  if (totalGames >= 10) {
    const chronological = [...scores].reverse(); // oldest first
    const third = Math.floor(chronological.length / 3);
    const beginSlice = chronological.slice(0, third);
    const midSlice = chronological.slice(third, third * 2);
    const endSlice = chronological.slice(third * 2);

    const computePhase = (slice: any[]) => {
      const games = slice.length;
      const totalCorrect = slice.reduce((s: number, g: any) => s + g.score, 0);
      const totalQs = slice.reduce((s: number, g: any) => s + g.total, 0);
      const acc = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
      const avgT = games > 0 ? Math.round(slice.reduce((s: number, g: any) => s + (g.time_used || 0), 0) / games) : 0;
      const perfect = slice.filter((g: any) => g.score === g.total).length;
      const timedOut = slice.filter((g: any) => g.timed_out === 1).length;
      return { games, accuracy: acc, avgTime: avgT, perfectRounds: perfect, timedOut };
    };

    const beginning = computePhase(beginSlice);
    const mid = computePhase(midSlice);
    const end = computePhase(endSlice);

    // Determine trend
    const accDelta = end.accuracy - beginning.accuracy;
    const timeDelta = end.avgTime - beginning.avgTime;
    let trend: 'improving' | 'declining' | 'stable';
    if (accDelta >= 5) trend = 'improving';
    else if (accDelta <= -5) trend = 'declining';
    else trend = 'stable';

    phases = { beginning, mid, end, trend, accDelta, timeDelta };

    phasePromptSection = `
Phase Progression (${totalGames} games split into thirds chronologically):
- Beginning (games 1–${beginning.games}): ${beginning.accuracy}% accuracy, avg ${beginning.avgTime}s, ${beginning.perfectRounds} perfect, ${beginning.timedOut} timed out
- Middle (games ${beginning.games + 1}–${beginning.games + mid.games}): ${mid.accuracy}% accuracy, avg ${mid.avgTime}s, ${mid.perfectRounds} perfect, ${mid.timedOut} timed out
- End (games ${beginning.games + mid.games + 1}–${totalGames}): ${end.accuracy}% accuracy, avg ${end.avgTime}s, ${end.perfectRounds} perfect, ${end.timedOut} timed out
- Overall trend: ${trend} (${accDelta >= 0 ? '+' : ''}${accDelta}% accuracy change, ${timeDelta >= 0 ? '+' : ''}${timeDelta}s time change from beginning to end)
`;
  }

  // ── Per-game analysis (computed/templated) ──
  const gameAnalysis = scores.map((s: any, idx: number) => {
    const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
    const timedOut = s.timed_out === 1;
    const isPerfect = s.score === s.total;
    const timeUsedPct = s.timer_limit > 0 ? Math.round((s.time_used / s.timer_limit) * 100) : 0;

    // Parse question details
    let details: any[] = [];
    if (s.details) {
      try { details = typeof s.details === 'string' ? JSON.parse(s.details) : s.details; } catch {}
    }

    const missed = details.filter((d: any) => !d.correct);
    const correct = details.filter((d: any) => d.correct);
    const missedWords = missed.map((d: any) => d.word).filter(Boolean);
    const slowQuestions = details.filter((d: any) => d.split_time && d.split_time > (s.timer_limit / s.total) * 1.5);

    // Compute weaknesses
    const weaknesses: string[] = [];
    if (timedOut) weaknesses.push('Ran out of time — consider a longer timer or fewer questions');
    if (pct < 50 && !timedOut) weaknesses.push('Low accuracy — focus on learning word meanings before speed');
    if (missedWords.length > 0 && missedWords.length >= s.total / 2) weaknesses.push('Missed ' + missedWords.length + '/' + s.total + ' words — vocabulary gaps');
    if (slowQuestions.length > 0 && !timedOut) weaknesses.push(slowQuestions.length + ' slow answer(s) — hesitation on uncertain words');
    if (timeUsedPct > 90 && !timedOut) weaknesses.push('Used ' + timeUsedPct + '% of timer — cutting it close');

    // Compute strengths / improvements
    const improvements: string[] = [];
    if (isPerfect) improvements.push('Perfect score! Flawless round');
    if (pct >= 80 && !isPerfect) improvements.push('Strong accuracy at ' + pct + '%');
    if (timeUsedPct < 50 && pct >= 70) improvements.push('Fast and accurate — great speed');
    if (correct.length > 0 && !isPerfect) improvements.push(correct.length + ' correct out of ' + s.total);
    if (idx > 0 && pct > (scores[idx - 1].total > 0 ? Math.round((scores[idx - 1].score / scores[idx - 1].total) * 100) : 0)) {
      improvements.push('Improved from previous game');
    }

    // Rating label
    let rating: string;
    if (isPerfect) rating = 'perfect';
    else if (pct >= 80) rating = 'great';
    else if (pct >= 60) rating = 'good';
    else if (pct >= 40) rating = 'fair';
    else rating = 'weak';

    return {
      gameNumber: totalGames - idx,
      score: s.score,
      total: s.total,
      accuracy: pct,
      timeUsed: s.time_used,
      timerLimit: s.timer_limit,
      timedOut,
      rating,
      missedWords,
      weaknesses,
      improvements,
      date: s.created_at,
    };
  });

  // ── Time split & usage analysis ──
  const timeUsagePct = avgTimerLimit > 0 ? Math.round((avgTime / avgTimerLimit) * 100) : 0;
  const avgSecondsPerWord = avgTotal > 0 ? Math.round((avgTime / avgTotal) * 10) / 10 : 0;
  const timerLimitsUsed = [...new Set(scores.map((s: any) => s.timer_limit))].sort((a: number, b: number) => a - b);
  const wordCountsUsed = [...new Set(scores.map((s: any) => s.total))].sort((a: number, b: number) => a - b);

  // Suggest timer/word changes based on patterns
  let timeSuggestion = '';
  if (timeUsagePct > 90 && totalTimedOut > totalGames * 0.3) {
    timeSuggestion = 'Player frequently runs out of time (>90% timer usage, >30% timeout rate). They should try a longer timer or fewer words per round to build confidence first.';
  } else if (timeUsagePct < 40 && accuracy >= 80) {
    timeSuggestion = 'Player finishes very quickly with high accuracy (<40% timer used). They should try a shorter timer for more challenge, or increase word count per round (e.g., 10 or 15 words) to test stamina.';
  } else if (timeUsagePct < 60 && accuracy < 60) {
    timeSuggestion = 'Player is fast but inaccurate — rushing answers. Suggest they slow down and use more of their timer, or try fewer words per round to focus on learning.';
  } else if (wordCountsUsed.length === 1 && totalGames >= 5) {
    timeSuggestion = `Player always uses ${wordCountsUsed[0]} words per round. Suggest varying word count (try ${wordCountsUsed[0] < 10 ? 'increasing to 10 or 15' : 'trying shorter 5-word sprints'}) for variety and different challenge levels.`;
  } else if (timerLimitsUsed.length === 1 && totalGames >= 5) {
    timeSuggestion = `Player always uses the same ${timerLimitsUsed[0]}s timer. Suggest experimenting with ${timerLimitsUsed[0] >= 90 ? 'a shorter 60s or 45s timer' : 'a longer timer'} to find their sweet spot.`;
  }

  // Build prompt for AI
  const prompt = buildQuizCoachPrompt({
    totalGames, accuracy, avgScore, avgTotal, totalPerfect, totalTimedOut,
    avgTime, avgTimerLimit, timeUsagePct, avgSecondsPerWord,
    timerLimitsUsed, wordCountsUsed, missedWords, recent5Accuracy,
    timeSuggestion, phasePromptSection, hasPhases: !!phases,
  });

  try {
    const aiResponse = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 450,
      temperature: 0.7,
    });

    const analysis = aiResponse.response || aiResponse.result?.response || 'Unable to generate analysis right now. Keep playing — your stats are being tracked!';

    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, accuracy, avgScore, avgTotal, totalPerfect, totalTimedOut, avgTime, timeUsagePct, avgSecondsPerWord, timerLimitsUsed, wordCountsUsed },
      phases,
      analysis,
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    // Fallback if AI call fails
    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, accuracy, avgScore, avgTotal, totalPerfect, totalTimedOut, avgTime, timeUsagePct, avgSecondsPerWord, timerLimitsUsed, wordCountsUsed },
      phases,
      analysis: getFallbackAnalysis(accuracy, totalPerfect, totalGames, totalTimedOut),
      gameAnalysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};

/** Pre-written wisdom for users with no quiz history */
function getWisdom(): string {
  const tips = [
    "Welcome to the Word Quiz! 🧠 Here's your first tip: when you see an unfamiliar word, look for Latin or Greek roots you might recognise. Words like BENEVOLENT (bene = good) or CIRCUMSCRIBE (circum = around) become much easier to decode when you spot the building blocks.",
    "Ready to test your vocabulary? ✨ Lex's tip: don't rush! Read all four options before choosing. Often two answers will be obviously wrong, leaving you with a 50/50 choice between similar meanings. Eliminate first, then decide.",
    "Hey there, word explorer! 📚 Here's a secret: context clues work even in a quiz. If a word sounds harsh (ACRID, CAUSTIC), it probably means something negative. If it sounds flowing (MELLIFLUOUS, SERENE), it's likely positive. Trust your instincts!",
    "First quiz? Exciting! 🎯 Pro tip from Lex: pay attention to word endings. Words ending in -OUS are usually adjectives, -TION are nouns, and -ATE are often verbs. This helps you match the word to the right type of definition.",
    "Welcome aboard, vocabulary champion! 🌟 Start with the shorter timer if you're confident, or go relaxed to learn without pressure. Either way, every word you encounter here strengthens your mental dictionary for Scrabble. Knowledge compounds!",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

/** Fallback analysis when AI is unavailable */
function getFallbackAnalysis(accuracy: number, perfectGames: number, totalGames: number, timedOut: number): string {
  if (accuracy >= 80) {
    return `Outstanding vocabulary! 🏆 You're nailing ${accuracy}% of questions with ${perfectGames} perfect rounds. Your word knowledge is clearly deep. To push further, try the shorter timer settings — speed recall under pressure is the ultimate Scrabble skill. You're already in the top tier!`;
  } else if (accuracy >= 60) {
    return `Solid word knowledge! 💪 ${accuracy}% accuracy shows you've got a strong foundation. ${timedOut > 0 ? "You've timed out " + timedOut + " time" + (timedOut > 1 ? "s" : "") + " — try a slightly longer timer to build confidence first, then reduce it." : "Your timing is good — now focus on those tricky words you miss."} Every quiz round is building your Scrabble vocabulary. Keep it up!`;
  } else {
    return `You're building something great! 🌱 Every quiz is practice for your word brain. At ${accuracy}% accuracy, you're learning new words with each round — that's the whole point! Try starting with 3-word quizzes and the relaxed timer. Short, frequent practice beats long cramming sessions every time. Your future Scrabble opponents won't know what hit them!`;
  }
}
