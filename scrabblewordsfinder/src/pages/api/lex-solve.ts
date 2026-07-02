import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/** Scrabble letter point values */
const LETTER_SCORES: Record<string, number> = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8, K:5, L:1, M:3,
  N:1, O:1, P:3, Q:10, R:1, S:1, T:1, U:1, V:4, W:4, X:8, Y:4, Z:10
};

/** Calculate Scrabble word score */
function wordScore(word: string): number {
  return [...word.toUpperCase()].reduce((s, c) => s + (LETTER_SCORES[c] || 0), 0);
}

/** Check if a word can be made from a rack (supports ? as blank) */
function canMake(word: string, rack: string): boolean {
  const available = rack.toLowerCase().split('');
  for (const ch of word.toLowerCase()) {
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

/** Cheat sheet knowledge for the AI system prompt */
const CHEAT_SHEET_KNOWLEDGE = `
## Scrabble Cheat Sheet Knowledge (SOWPODS)

### Key Two-Letter Words (memorize these!)
AA, AB, AD, AE, AG, AH, AI, AL, AM, AN, AR, AS, AT, AW, AX, AY,
BA, BE, BI, BO, BY, DA, DE, DI, DO, EA, ED, EE, EF, EH, EL, EM,
EN, ER, ES, ET, EX, FA, FE, FY, GI, GO, GU, HA, HE, HI, HM, HO,
ID, IF, IN, IO, IS, IT, JA, JO, KA, KI, KO, KY, LA, LI, LO, MA,
ME, MI, MO, MU, MY, NA, NE, NO, NU, NY, OB, OD, OE, OF, OH, OI,
OM, ON, OO, OP, OR, OS, OU, OW, OX, OY, PA, PE, PI, PO, QI, RE,
SH, SI, SO, ST, TA, TE, TI, TO, UG, UH, UM, UN, UP, UR, US, UT,
WE, WO, XI, XU, YA, YE, YO, YU, ZA, ZO

### Q Without U Words
QI, QADI, QANAT, QAT, QIBLA, QINTAR, QOPH, QORMA, QWERTY, TRANQ, WAQF, QABALAH, QAID, QAIDS, QATS, QAWWALI, QINTARS, QOPHS

### High-Value Short Words (J, Q, X, Z)
JO (9), QI (11), XI (9), XU (9), ZA (11), ZO (11), AX (9), EX (9), OX (9)
JAB (12), JAG (11), JAM (12), JAR (10), JAW (13), JAY (13), JOB (12), JOE (10), JOG (11), JOT (10)
ZAP (14), ZAX (19), ZEP (14), ZIT (12), ZAG (13), ZEK (16)

### Vowel Dump Words (when you have too many vowels)
AALII, AEON, AQUAE, AREAE, AUDIO, AURAE, OURIE, URAEI, ADIEU, AIOLI

### Tile Distribution (100 tiles total)
A×9, B×2, C×2, D×4, E×12, F×2, G×3, H×2, I×9, J×1, K×1, L×4, M×2,
N×6, O×8, P×2, Q×1, R×6, S×4, T×6, U×4, V×2, W×2, X×1, Y×2, Z×1, Blank×2

### Scoring Strategy Tips
- Triple Word Square + high-value tile = massive score
- S plurals extend existing words for double scoring
- Parallel plays (placing alongside existing word) score both directions
- Blank tiles score 0 but enable bingos (50-point bonus for using all 7 tiles)
- Rack leave: keep a balance of vowels and consonants after your play
- Best opening move uses the centre star (double word score)

### Bingo Stems (learn these 6-letter combos that form many 7-letter words)
SATIRE, RETINA, RETAIN, TISANE, SALINE, SENIOR, TENORS, ARISEN, ORNATE, STAINER

### Rack Leave Principles
- Ideal rack leave: 3 consonants + 2 vowels (or 2+2 if playing 5 letters)
- Avoid keeping: QUV together, too many of same letter, all vowels
- Good consonants to keep: S, R, N, T, L
- Good vowels to keep: E, A
- Dump bad tiles (V, U, Q without words) even at lower score plays
`;

/** System prompt for Lex AI Solver mode */
const SOLVER_SYSTEM_PROMPT = `You are Lex, the AI Scrabble Coach on ScrabbleWordsFinder.com. You are in SOLVER MODE — the user has given you their rack tiles and the algorithm has already found the best words.

CRITICAL RULE: You MUST ONLY recommend words from the "Best words found" list provided below. NEVER suggest your own words. NEVER recommend a word that is not explicitly listed in the results. The algorithm has already verified which words are valid and scored them — trust it completely.

Your job is to provide brief, expert coaching about the ALGORITHMICALLY FOUND results:
1. Recommend the FIRST word in the provided "Best words found" list — it is always the best play
2. If a word is marked as BINGO (+50 bonus), emphasize that it's the best play since it uses all 7 tiles
3. Comment on rack leave (what tiles remain after playing the best word)
4. Give one quick tactical tip relevant to their specific tiles

${CHEAT_SHEET_KNOWLEDGE}

FORMATTING RULES:
- Be concise: 2-3 short paragraphs max
- Use plain text, no markdown headers or bold
- Sound like a friendly coach, not a textbook
- Always mention the top word's score (use the score from the provided list, not your own calculation)
- NEVER recommend a word that isn't in the "Best words found" list — even if you think another word exists
- If the rack is poor (all consonants, duplicate tiles), acknowledge it and suggest a dump strategy
- End with an encouraging one-liner`;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { rack } = body;
  if (!rack || typeof rack !== 'string' || rack.length < 2 || rack.length > 7) {
    return json({ error: 'Rack must be 2-7 letters (A-Z or ? for blank)' }, 400);
  }

  const cleanRack = rack.toUpperCase().replace(/[^A-Z?]/g, '');
  if (cleanRack.length < 2) {
    return json({ error: 'Rack must contain at least 2 valid tiles' }, 400);
  }

  // Solve: find all words from the rack using the DB dictionary
  const db = (env as any).DB;
  const AI = (env as any).AI;

  if (!AI) {
    return json({ error: 'AI service unavailable' }, 503);
  }

  let solvedWords: { word: string; score: number }[] = [];

  try {
    // Always use the full SOWPODS dictionary file (74K+ words) as primary source
    try {
      const dictUrl = new URL('/data/sowpods-2-7.json', request.url);
      const dictRes = await fetch(dictUrl.toString());
      if (dictRes.ok) {
        const words: string[] = await dictRes.json();
        solvedWords = words
          .filter(w => w.length <= cleanRack.length && canMake(w, cleanRack))
          .map(w => ({ word: w.toUpperCase(), score: wordScore(w) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 25);
      }
    } catch {
      // If SOWPODS fetch fails, fall back to DB dictionary
      if (db) {
        const { results: rows } = await db.prepare(
          'SELECT word, points FROM dictionary WHERE LENGTH(word) <= ? ORDER BY points DESC'
        ).bind(cleanRack.length).all();

        if (rows && rows.length > 0) {
          solvedWords = rows
            .filter((r: any) => canMake(r.word, cleanRack))
            .map((r: any) => ({ word: r.word.toUpperCase(), score: r.points as number }))
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 25);
        }
      }
    }
  } catch {
    // Non-fatal — proceed with empty results
  }

  // Build the word list summary for the AI
  const topWords = solvedWords.slice(0, 10);
  const wordListForAI = topWords.length > 0
    ? topWords.map(w => {
        const isBingo = w.word.length === cleanRack.length && cleanRack.length === 7;
        return isBingo
          ? `${w.word} (${w.score} pts + 50 BINGO BONUS = ${w.score + 50} total!)`
          : `${w.word} (${w.score} pts)`;
      }).join(', ')
    : 'No valid words found';

  // Identify bingos
  const bingos = topWords.filter(w => w.word.length === cleanRack.length && cleanRack.length === 7);
  const hasBingo = bingos.length > 0;

  // Re-sort topWords with bingos first (they're always best due to +50 bonus)
  if (hasBingo) {
    topWords.sort((a, b) => {
      const aIsBingo = a.word.length === cleanRack.length && cleanRack.length === 7;
      const bIsBingo = b.word.length === cleanRack.length && cleanRack.length === 7;
      if (aIsBingo && !bIsBingo) return -1;
      if (!aIsBingo && bIsBingo) return 1;
      // Within same category, sort by score
      const aTotal = aIsBingo ? a.score + 50 : a.score;
      const bTotal = bIsBingo ? b.score + 50 : b.score;
      return bTotal - aTotal;
    });
  }

  // Calculate rack leave for top word
  let rackLeaveInfo = '';
  if (topWords.length > 0) {
    // If there's a bingo, use that as the best word regardless of raw score
    const bestPlay = hasBingo ? bingos[0] : topWords[0];
    const bestWord = bestPlay.word.toLowerCase();
    const remaining = cleanRack.toLowerCase().split('');
    for (const ch of bestWord) {
      const idx = remaining.indexOf(ch);
      if (idx >= 0) remaining.splice(idx, 1);
      else {
        const bIdx = remaining.indexOf('?');
        if (bIdx >= 0) remaining.splice(bIdx, 1);
      }
    }
    rackLeaveInfo = remaining.length > 0
      ? `Rack leave after playing ${bestPlay.word}: ${remaining.join('').toUpperCase()}`
      : `Playing ${bestPlay.word} uses ALL 7 tiles — BINGO! (+50 bonus = ${bestPlay.score + 50} total)`;
  }

  // Ask Workers AI for coaching
  let coaching = '';
  try {
    // Determine the absolute best play to highlight
    const bestPlay = hasBingo ? bingos[0] : topWords[0];
    const bestPlayLabel = bestPlay
      ? (hasBingo
          ? `${bestPlay.word} (${bestPlay.score} pts + 50 BINGO BONUS = ${bestPlay.score + 50} total)`
          : `${bestPlay.word} (${bestPlay.score} pts)`)
      : 'none';

    const userPrompt = `My rack is: ${cleanRack}

Best words found (in order, #1 is the best): ${wordListForAI}
${rackLeaveInfo}
Total words possible: ${solvedWords.length}
${hasBingo ? `\n🎯 BINGO AVAILABLE! ${bingos.map(b => b.word).join(', ')} use(s) ALL 7 tiles for +50 bonus! This is ALWAYS the best play.\n` : ''}
THE #1 RECOMMENDED PLAY IS: ${bestPlayLabel}. Recommend THIS word to me. Do NOT suggest any other word as the best play.`;

    const aiResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: SOLVER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    coaching = aiResponse?.response || '';
  } catch {
    coaching = topWords.length > 0
      ? `Your best play is ${topWords[0].word} for ${topWords[0].score} points. ${rackLeaveInfo}.`
      : 'No valid words found from this rack. Consider exchanging tiles if possible.';
  }

  return json({
    words: topWords,
    coaching,
    totalFound: solvedWords.length,
    rack: cleanRack,
    bingos: bingos.map(b => ({ word: b.word, score: b.score, total: b.score + 50 })),
  });
};

export const GET: APIRoute = async () => {
  return json({ status: 'ok', endpoint: 'lex-solve', method: 'POST required' });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
