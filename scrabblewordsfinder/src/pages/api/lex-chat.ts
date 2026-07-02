import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { scoreRack, rackQualitySummary, compareLeaves } from '../../lib/rack-quality';

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

/**
 * Detect if a message is asking about words from a rack/set of letters.
 * Returns the extracted rack (uppercase, 2-15 letters) or null if not a rack question.
 */
function detectRack(message: string): string | null {
  const msg = message.trim();

  // Pattern 1: "words from/with/in LETTERS" or "make from LETTERS"
  const fromPattern = /(?:words?|make|find|play|get|form|create|build|spell)\s+(?:from|with|in|using|out of|for)\s+(?:the\s+)?(?:letters?\s+)?(?:rack\s+)?([A-Za-z?]{2,15})\b/i;
  const m1 = msg.match(fromPattern);
  if (m1) return m1[1].toUpperCase().replace(/[^A-Z?]/g, '') || null;

  // Pattern 2: "best word/play for LETTERS" or "best move with LETTERS"
  const bestPattern = /(?:best|top|highest|longest)\s+(?:word|play|move|score|scoring)\s+(?:for|from|with|using)\s+(?:the\s+)?(?:letters?\s+)?(?:rack\s+)?([A-Za-z?]{2,15})\b/i;
  const m2 = msg.match(bestPattern);
  if (m2) return m2[1].toUpperCase().replace(/[^A-Z?]/g, '') || null;

  // Pattern 3: "my rack is LETTERS" or "rack: LETTERS" or "tiles: LETTERS"
  const rackPattern = /(?:my\s+)?(?:rack|tiles?|letters?)\s*(?:is|are|:)\s*([A-Za-z?, ]{2,30})/i;
  const m3 = msg.match(rackPattern);
  if (m3) {
    const cleaned = m3[1].replace(/[^A-Za-z?]/g, '').toUpperCase();
    if (cleaned.length >= 2 && cleaned.length <= 15) return cleaned;
  }

  // Pattern 4: "what can I make/spell with LETTERS"
  const whatCanPattern = /what\s+(?:can|could|words?)\s+(?:I\s+)?(?:make|spell|play|form|find)\s+(?:with|from|using)\s+(?:the\s+)?(?:letters?\s+)?(?:rack\s+)?([A-Za-z?]{2,15})\b/i;
  const m4 = msg.match(whatCanPattern);
  if (m4) return m4[1].toUpperCase().replace(/[^A-Z?]/g, '') || null;

  // Pattern 5: "I have LETTERS" (only if 4+ letters, to avoid false positives)
  const havePattern = /I\s+(?:have|got|hold|drew)\s+(?:the\s+)?(?:letters?\s+)?(?:rack\s+)?([A-Za-z?]{4,15})\b/i;
  const m5 = msg.match(havePattern);
  if (m5) return m5[1].toUpperCase().replace(/[^A-Z?]/g, '') || null;

  // Pattern 6: Spaced-out letters like "A D I N E R T" or "A, D, I, N, E, R, T"
  const spacedPattern = /(?:letters?\s*(?:are|:)?\s*)?([A-Za-z?](?:\s*[,\s]\s*[A-Za-z?]){3,14})/;
  const m6 = msg.match(spacedPattern);
  if (m6) {
    const cleaned = m6[1].replace(/[^A-Za-z?]/g, '').toUpperCase();
    // Only match if the spaced letters form the bulk of the message or are in context
    if (cleaned.length >= 4 && cleaned.length <= 15 && cleaned.length * 3 >= m6[1].length) {
      return cleaned;
    }
  }

  // Pattern 7: "bingos in/from/for WORD" or "bingos ... with WORD" (flexible — allows words between)
  const bingoLastWordPattern = /\bbingos?\b.*?\b(?:in|from|for|with|using)\s+([A-Za-z]{4,15})\s*\??$/i;
  const m7 = msg.match(bingoLastWordPattern);
  if (m7) return m7[1].toUpperCase().replace(/[^A-Z]/g, '') || null;

  // Pattern 8: "words in WORD" or "anagrams of WORD" or "played with/from WORD"
  const wordsInPattern = /(?:words?|anagrams?|plays?|played)\s+(?:in|of|from|for|with)\s+([A-Za-z]{4,15})\b/i;
  const m8 = msg.match(wordsInPattern);
  if (m8) return m8[1].toUpperCase().replace(/[^A-Z]/g, '') || null;

  return null;
}

/**
 * Solve a rack: find all valid words from the given tiles.
 * Uses D1 dictionary table first, falls back to JSON file.
 */
async function solveRack(rack: string, request: Request): Promise<{ word: string; score: number }[]> {
  const db = (env as any).DB;
  let solvedWords: { word: string; score: number }[] = [];

  try {
    if (db) {
      const { results: rows } = await db.prepare(
        'SELECT word, points FROM dictionary WHERE LENGTH(word) <= ? ORDER BY points DESC'
      ).bind(rack.length).all();

      if (rows && rows.length > 0) {
        solvedWords = rows
          .filter((r: any) => canMake(r.word, rack))
          .map((r: any) => ({ word: r.word.toUpperCase(), score: r.points as number }))
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 25);
      }
    }
  } catch {
    // DB query failed — try fallback
  }

  // Fallback: fetch from the public dictionary JSON
  // Also runs if DB returned results but missed full-length words (incomplete dictionary table)
  const hasFullLengthWord = solvedWords.some(w => w.word.length === rack.length);
  if (solvedWords.length === 0 || (!hasFullLengthWord && rack.length >= 4)) {
    try {
      // Determine which dict files to use based on rack length
      const dictUrl = rack.length <= 7
        ? new URL('/data/sowpods-2-7.json', request.url)
        : new URL('/data/sowpods-8-15.json', request.url);

      const dictRes = await fetch(dictUrl.toString());
      if (dictRes.ok) {
        const words: string[] = await dictRes.json();
        solvedWords = words
          .filter(w => w.length <= rack.length && canMake(w, rack))
          .map(w => ({ word: w.toUpperCase(), score: wordScore(w) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 25);
      }

      // If rack is > 7 letters, also check the 2-7 dict for shorter words
      if (rack.length > 7) {
        const shortDictUrl = new URL('/data/sowpods-2-7.json', request.url);
        const shortRes = await fetch(shortDictUrl.toString());
        if (shortRes.ok) {
          const shortWords: string[] = await shortRes.json();
          const moreWords = shortWords
            .filter(w => w.length <= rack.length && canMake(w, rack))
            .map(w => ({ word: w.toUpperCase(), score: wordScore(w) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 25);

          // Merge and deduplicate
          const seen = new Set(solvedWords.map(w => w.word));
          for (const w of moreWords) {
            if (!seen.has(w.word)) {
              solvedWords.push(w);
              seen.add(w.word);
            }
          }
          solvedWords.sort((a, b) => b.score - a.score);
          solvedWords = solvedWords.slice(0, 25);
        }
      }
    } catch {
      // Fallback also failed
    }
  }

  return solvedWords;
}

/** System prompt for Lex AI Chat mode (general Scrabble Q&A) */
const CHAT_SYSTEM_PROMPT = `You are Lex, the AI Scrabble Coach on ScrabbleWordsFinder.com. You are in CHAT MODE — the user is asking you general questions about Scrabble strategy, words, rules, definitions, or tips.

CRITICAL RULE: NEVER list specific words as examples unless you are 100% certain they are valid Scrabble words. If the user asks about words from a specific rack/set of letters, tell them to use the solver (the "Find Words" button) to get verified results — do NOT guess or invent word lists yourself. The solver has the full SOWPODS dictionary; you do not.

CRITICAL RULE: If the user asks a follow-up question about "bingos", "which words", or "what plays" from a previous result, and no rack context is available, tell them: "I can see the solver already found your words above — the bingos are any words that use all 7 of your tiles. Check the results list for 7-letter words." Do NOT invent your own word list.

Your personality:
- Friendly, knowledgeable, concise
- You love Scrabble and enjoy helping players improve
- You reference actual Scrabble rules and strategy concepts
- You know SOWPODS and TWL dictionaries

What you can help with:
- Strategy advice (rack management, board control, endgame)
- Rules clarifications
- General concepts about two-letter words, Q-without-U words, bingo stems
- Tile distribution and probability
- General Scrabble trivia and history
- Tips for improving at competitive Scrabble
- Answering questions about high-scoring words, two-letter words, Q-without-U words using the verified reference lists below

## Verified Word Lists (use these confidently in answers)

### All Two-Letter Words (SOWPODS — 124 total)
Highest: QI(11) ZA(11) ZO(11) AX(9) EX(9) JA(9) JO(9) KY(9) OX(9) XI(9) XU(9)
Mid-value: FY(8) BY(7) CH(7) HM(7) MY(7) KA(6) KI(6) KO(6) MM(6)
Common: AA AB AD AE AG AH AI AL AM AN AR AS AT AW AY BA BE BI BO DA DE DI DO EA ED EE EF EH EL EM EN ER ES ET FA FE GI GO GU HA HE HI HO ID IF IN IO IS IT LA LI LO MA ME MI MO MU NA NE NO NU NY OB OD OE OF OH OI OM ON OO OP OR OS OU OW OY PA PE PI PO QI RE SH SI SO ST TA TE TI TO UG UH UM UN UP UR US UT WE WO YA YE YO YU ZA ZO

### Top 3-Letter Words by Score
ZZZ(30) ZIZ(21) ZUZ(21) JIZ(19) ZAX(19) ZEX(19) ZEK(16) FEZ(15) FIZ(15) PYX(15) WIZ(15) ZHO(15) BEZ(14) BIZ(14) CAZ(14) COZ(14) CUZ(14) JAK(14) KEX(14) MIZ(14) MOZ(14) POZ(14) ZAP(14) ZEP(14) ZIP(14) ADZ(13) DZO(13) FAX(13) FIX(13) FOX(13)

### Top Words by Length
2-letter: QI(11) ZA(11) ZO(11) AX(9) EX(9)
3-letter: ZZZ(30) ZIZ(21) ZUZ(21) JIZ(19) ZAX(19)
4-letter: ZIZZ(31) ZZZS(31) JAZZ(29) JIZZ(29) FIZZ(25)
5-letter: PZAZZ(34) JAZZY(33) FEZZY(29) FIZZY(29) FUZZY(29)

### Q-without-U Words (54 total — key ones)
Short: QI(11) QADI(14) QAID(14) QATS(13) QANAT(14) TALAQ(14) TRANQ(14)
Medium: QOPH(18) WAQF(19) FAQIR(17) NIQAB(16) QIBLA(16) QORMA(16) QINDAR(16) QINTAR(15) QASIDA(16) SHEQEL(18) QIGONG(17)
Longer: QWERTY(21) QABALAH(21) QAWWAL(21) QAWWALI(22) QINDARKA(22) QABBALAH(24) QOHELETH(23) TZADDIQ(27) QAIMAQAM(30)

### Rare Letter Power Words (highest-scoring with Q, Z, X, J, K)
Z-words: RAZZMATAZZ(48) PIZZAZZ(45) ZYZZYVA(43) QUIZZIFICATION(46) QUIZZICALLY(43)
X-words: OXYBENZALDEHYDE(44) BENZOXYCAMPHOR(44) HYPEROXYGENIZED(44)
J-words: JOUKERYPAWKERY(40) KJELDAHLIZATION(39) JAZZLIKE(37) JACUZZI(34) JAZZY(33)

What you must NOT do:
- NEVER generate lists of specific playable words from a rack — always defer to the solver
- NEVER say "here are some bingos" and list words you made up
- NEVER claim a specific word is valid unless it appears in the Verified Word Lists above or is a well-known word
- If unsure whether a word is valid, say "check it in the solver" rather than guessing
- You MAY confidently cite words from the Verified Word Lists above — these are confirmed SOWPODS words

FORMATTING RULES:
- Keep responses concise (2-4 short paragraphs max)
- Use plain text, no markdown formatting
- Sound like a friendly coach chatting between games
- If you don't know something for certain, say so honestly
- When asked about specific words from tiles, redirect to the solver tool
- When asked about two-letter words, Q-without-U, high-scoring words, or rare letters, reference the verified lists above with specific words and scores`;

/** Enhanced system prompt when rack solving is active */
const SOLVER_CHAT_SYSTEM_PROMPT = `You are Lex, the AI Scrabble Coach on ScrabbleWordsFinder.com. The user asked about words from a rack and you have REAL ALGORITHMIC RESULTS from the full SOWPODS dictionary.

CRITICAL RULE: You MUST ONLY mention words from the "VERIFIED WORD LIST" provided below. NEVER suggest your own words. NEVER recommend a word that is not explicitly listed in the results. NEVER generate alternative word lists. The algorithm has the full SOWPODS dictionary and has already found ALL valid words — trust it completely.

CRITICAL RULE: If the user asks "which ones are bingos" or similar follow-up questions, the answer is ONLY the words from the VERIFIED WORD LIST below that use ALL tiles from the rack (same length as the rack). Do NOT invent other bingos. If no 7-letter words appear in the list, say "no bingos are possible from this rack."

Your job:
1. Highlight the BEST word(s) — prioritise 7-letter bingos (50pt bonus!) over shorter words
2. If there are 7-letter words that use all tiles, LEAD with those — bingo bonus makes them almost always the best play
3. Comment on rack leave after playing the best word
4. Give one tactical tip relevant to their specific tiles
5. Be enthusiastic about bingos!

FORMATTING RULES:
- Keep responses concise (2-3 short paragraphs max)
- Use plain text, no markdown formatting
- Sound like a friendly coach excited about their tiles
- Always mention scores (include +50 bonus for bingos that use all 7 tiles)
- NEVER suggest words that aren't in the verified list below — even if you think another word exists
- If asked "which are bingos", list ONLY the words from the verified list that are the same length as the rack`;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { message, context } = body;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return json({ error: 'Message is required' }, 400);
  }

  if (message.length > 500) {
    return json({ error: 'Message too long (max 500 characters)' }, 400);
  }

  const AI = (env as any).AI;
  if (!AI) {
    return json({ error: 'AI service unavailable' }, 503);
  }

  // Detect if the user is asking about a rack
  let detectedRack = detectRack(message);

  // If no rack detected but context provides a previous rack, use that for follow-up questions
  // This handles "which ones are bingos" after a solver run
  if (!detectedRack && context && typeof context === 'object' && context.rack) {
    const contextRack = String(context.rack).toUpperCase().replace(/[^A-Z?]/g, '');
    if (contextRack.length >= 2 && contextRack.length <= 15) {
      // Only use context rack if the message seems like a follow-up about words/bingos
      const followUpPattern = /\b(bingo|bingos|which|best|top|longest|highest|play|word|words|score|scoring|anagram)\b/i;
      if (followUpPattern.test(message)) {
        detectedRack = contextRack;
      }
    }
  }

  try {
    let systemPrompt = CHAT_SYSTEM_PROMPT;
    let userPrompt = message.trim();

    // If a rack was detected, solve it and inject results
    if (detectedRack && detectedRack.length >= 2 && detectedRack.length <= 15) {
      const solvedWords = await solveRack(detectedRack, request);

      if (solvedWords.length > 0) {
        const topWords = solvedWords.slice(0, 15);
        const bingos = topWords.filter(w => w.word.length === detectedRack.length && detectedRack.length === 7);
        const hasBingo = bingos.length > 0;

        // Calculate rack leave for top word
        let rackLeaveInfo = '';
        const bestWord = topWords[0].word.toLowerCase();
        const remaining = detectedRack.toLowerCase().split('');
        for (const ch of bestWord) {
          const idx = remaining.indexOf(ch);
          if (idx >= 0) remaining.splice(idx, 1);
          else {
            const bIdx = remaining.indexOf('?');
            if (bIdx >= 0) remaining.splice(bIdx, 1);
          }
        }
        rackLeaveInfo = remaining.length > 0
          ? `Rack leave after ${topWords[0].word}: ${remaining.join('').toUpperCase()}`
          : `${topWords[0].word} uses ALL tiles — BINGO! (+50 bonus = ${topWords[0].score + 50} total)`;

        const wordListStr = topWords.map(w => {
          const isBingo = w.word.length === detectedRack.length && detectedRack.length === 7;
          return `${w.word} (${w.score}pts${isBingo ? ' +50 BINGO BONUS = ' + (w.score + 50) + ' total' : ''})`;
        }).join('\n');

        systemPrompt = SOLVER_CHAT_SYSTEM_PROMPT;
        userPrompt = `My rack is: ${detectedRack}

VERIFIED WORD LIST (from full SOWPODS dictionary):
${wordListStr}

${hasBingo ? `BINGOS (words using ALL 7 tiles = +50 bonus):\n${bingos.map(b => `- ${b.word} (${b.score}pts + 50 bonus = ${b.score + 50} total)`).join('\n')}\n` : 'NO BINGOS possible from this rack (no 7-letter word uses all tiles).\n'}
${rackLeaveInfo}
Total valid words found: ${solvedWords.length}

📊 RACK QUALITY: ${rackQualitySummary(detectedRack)}
${!hasBingo && topWords.length >= 2 ? `LEAVE COMPARISON: ${compareLeaves(detectedRack, topWords.slice(0, 3).map(w => w.word)).map(l => `${l.play} → leave ${l.leave || '(none)'} (${l.leaveScore}/100)`).join(' | ')}` : ''}

Original question: ${message.trim()}

${hasBingo ? `ANSWER: There are ${bingos.length} bingo(s) from this rack: ${bingos.map(b => b.word).join(', ')}. Each scores ${bingos[0].score} + 50 bonus = ${bingos[0].score + 50} points. Recommend these as the best plays and explain why bingos are always the top choice.` : 'Give me coaching on the best play from the list.'}`;
      }
    }

    const aiResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 400,
      temperature: detectedRack ? 0.3 : 0.7,
    });

    const reply = aiResponse?.response || 'I couldn\'t generate a response right now. Try again!';

    // Factual prefix: if bingos were found and the user asked about them,
    // prepend the verified answer so the user always sees correct data
    // regardless of what the AI model says (small models often hallucinate "no bingos")
    let factualPrefix = '';
    if (detectedRack && detectedRack.length === 7) {
      // Re-check if we built solver results (hasBingo is scoped inside the if block above)
      const isBingoQuestion = /\bbingos?\b/i.test(message);
      if (isBingoQuestion) {
        // Re-solve quickly to get bingos (the solver result was used in prompt building)
        const verifyWords = await solveRack(detectedRack, request);
        const verifyBingos = verifyWords.filter(w => w.word.length === 7);
        if (verifyBingos.length > 0) {
          factualPrefix = `From your rack ${detectedRack}, the bingos are: ${verifyBingos.map(b => `${b.word} (${b.score + 50} pts with bingo bonus)`).join(', ')}.\n\n`;
        } else {
          factualPrefix = `No bingos are possible from ${detectedRack} — no 7-letter word can be formed from these tiles.\n\n`;
        }
      }
    }


    // Multilingual enrichment: if the message is about a word's definition, origin, or meaning,
    // fetch a "did you know" translation line using GLM-4.7-flash
    let multilingualTip = '';
    const wordTopicMatch = message.trim().match(
      /(?:what\s+(?:is|does)\s+|define\s+|meaning\s+of\s+|origin\s+of\s+|etymology\s+of\s+|tell\s+me\s+about\s+(?:the\s+word\s+)?)([A-Za-z]{3,15})\b/i
    );
    if (wordTopicMatch && !detectedRack) {
      try {
        const targetWord = wordTopicMatch[1].toUpperCase();
        const langResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
          messages: [
            { role: 'system', content: 'You are a concise multilingual translator. Return ONLY a short one-line trivia fact about the word in other languages. Format: "In other languages: [word] in French, [word] in Spanish, [word] in Italian." Use lowercase translations. Max 80 characters total.' },
            { role: 'user', content: `Give me a one-line "In other languages" trivia for the English word "${targetWord}". Include French, Spanish, and one other interesting language.` }
          ],
          max_tokens: 80,
          temperature: 0.3,
        });
        const langTip = langResponse?.response?.trim();
        if (langTip && langTip.length > 10 && langTip.length < 150) {
          multilingualTip = '\n\n🌍 ' + langTip;
        }
      } catch {
        // Non-critical — skip multilingual tip on failure
      }
    }

    return json({ reply: factualPrefix + reply + multilingualTip });
  } catch {
    return json({ error: 'AI request failed. Please try again.' }, 500);
  }
};

export const GET: APIRoute = async () => {
  return json({ status: 'ok', endpoint: 'lex-chat', method: 'POST required' });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
