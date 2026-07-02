import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;
const getAI = () => (env as any).AI;

/**
 * POST /api/lex-anagram-coach/
 * Lex AI analyses the user's Daily Anagram history and returns coaching feedback.
 * If no history exists, returns motivational wisdom.
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

  // Fetch user's anagram history
  const result = await db.prepare(
    'SELECT date, attempts, solved, guesses, time_taken FROM daily_anagram_scores WHERE user_id = ? ORDER BY date DESC LIMIT 30'
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
  const totalSolved = scores.filter((s: any) => s.solved === 1).length;
  const solveRate = Math.round((totalSolved / totalGames) * 100);
  const avgAttempts = Math.round((scores.reduce((sum: number, s: any) => sum + s.attempts, 0) / totalGames) * 10) / 10;
  const avgTime = scores.filter((s: any) => s.time_taken > 0).length > 0
    ? Math.round(scores.filter((s: any) => s.time_taken > 0).reduce((sum: number, s: any) => sum + s.time_taken, 0) / scores.filter((s: any) => s.time_taken > 0).length)
    : 0;

  // Current streak
  let streak = 0;
  for (const s of scores) {
    if (s.solved === 1) streak++;
    else break;
  }

  // Recent trend (last 5 games)
  const recent5 = scores.slice(0, 5);
  const recent5Solved = recent5.filter((s: any) => s.solved === 1).length;

  // Build prompt for AI
  const prompt = `You are Lex, a friendly and encouraging AI word coach for a Scrabble & anagram game site. Analyze this player's Daily Anagram performance and give short, actionable coaching advice.

Player Stats (last ${totalGames} games):
- Solve rate: ${solveRate}% (${totalSolved}/${totalGames} solved)
- Average attempts per game: ${avgAttempts}/5
- Average solve time: ${avgTime > 0 ? avgTime + ' seconds' : 'not tracked'}
- Current streak: ${streak} days
- Last 5 games: ${recent5Solved}/5 solved

Give a brief coaching response (max 150 words) that:
1. Acknowledges their performance (be encouraging, not patronizing)
2. Identifies one specific strength
3. Gives one tip to improve (e.g., look for common prefixes/suffixes, try vowel patterns first, start with common letter combos)
4. Ends with a short motivational line

Keep the tone warm, concise, and game-focused. Use 1-2 relevant emoji. Do NOT use markdown headers or bullet points — write in short conversational paragraphs.`;

  try {
    const aiResponse = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    });

    const analysis = aiResponse.response || aiResponse.result?.response || 'Unable to generate analysis right now. Keep playing — your stats are being tracked!';

    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, totalSolved, solveRate, avgAttempts, avgTime, streak },
      analysis,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    // Fallback if AI call fails
    return new Response(JSON.stringify({
      hasHistory: true,
      stats: { totalGames, totalSolved, solveRate, avgAttempts, avgTime, streak },
      analysis: getFallbackAnalysis(solveRate, avgAttempts, streak),
    }), { headers: { 'Content-Type': 'application/json' } });
  }
};

/** Pre-written wisdom for users with no game history */
function getWisdom(): string {
  const tips = [
    "Welcome to the Daily Anagram! 🔤 Here's a tip to get you started: look for common letter patterns like TH, ING, TION, and ED. These combos appear in most English words and give you a strong starting framework to unscramble from.",
    "Hey there, future anagram champion! 🧠 Start by identifying vowels and consonants separately, then try pairing them. Most English words alternate between vowels and consonants — use that rhythm to your advantage.",
    "Ready to become an anagram master? ✨ Try this: look for prefixes (UN-, RE-, PRE-) and suffixes (-LY, -ED, -ING) first. Once you spot those, the remaining letters often click into place instantly.",
    "Welcome aboard! 🎯 Pro tip from Lex: don't just stare at the scrambled letters in order. Try reading them backwards, or pick out 2-3 letter combos you recognise. Your brain will pattern-match faster than brute-forcing every combo.",
    "First time? Exciting! 🌟 Here's Lex's golden rule: vowels are your anchors. Spot them first, then build consonant clusters around them. Words like STRIDE, CASTLE, PLANET — they all follow predictable vowel-consonant patterns.",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

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
