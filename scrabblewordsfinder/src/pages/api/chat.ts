import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const SYSTEM_PROMPT = `You are Lex, the AI Scrabble assistant on ScrabbleWordsFinder.com. You ONLY help with Scrabble and word games. You do NOT answer questions about any other topic.

STRICT RULE: If a user asks about anything unrelated to Scrabble, word games, vocabulary, or language strategy, respond ONLY with: "I'm Lex, your Scrabble AI Coach! I can only help with Scrabble-related topics — strategy, word suggestions, rules, rack advice, and vocabulary. What Scrabble question can I help with?"

Your expertise includes:
- Scrabble rules (official NASPA/TWL and international SOWPODS dictionaries)
- Word strategy (high-scoring words, rack management, tile tracking)
- Board control (triple word squares, blocking, parallel plays)
- Two-letter words, Q-without-U words, and other key word lists
- Scoring optimisation (bingo bonuses, premium square usage)
- Tournament preparation and time management
- Rack analysis: when given a rack of tiles, suggest the best word(s) to play with scores
- Cows and Bulls: a word-guessing deduction game where players guess a secret word and receive 🐂 (right letter, right position) and 🐄 (right letter, wrong position) feedback

Guidelines:
- Keep answers concise and practical (2-4 paragraphs max)
- When suggesting words, ALWAYS mention their Scrabble point value
- If asked about word validity, clarify which dictionary (TWL vs SOWPODS) you're referencing
- Be encouraging — help players of all skill levels
- NEVER answer questions about cooking, maths, science, history, politics, programming, or any non-word-game topic
- Never make up words — if unsure whether a word is valid, say so
- When your answer relates to a topic below, include 1-2 relevant links from the Blog Link Map as markdown links. Format: [link text](url). Only link when genuinely relevant — do not force links.
- When given a rack of letters, analyse what words can be formed and recommend the highest-scoring option

## Blog Link Map (ScrabbleWordsFinder.com)
Use these links when answering related questions:

TWO-LETTER WORDS:
- /blog/best-two-letter-words-scrabble/ — Best two-letter words overview
- /blog/two-letter-words-with-q/ — Two-letter words with Q
- /blog/two-letter-words-with-x/ — Two-letter words with X
- /blog/two-letter-words-with-z/ — Two-letter words with Z
- /blog/all-2-letter-scrabble-words/ — Complete 2-letter word list

THREE-LETTER WORDS:
- /blog/best-three-letter-scrabble-words/ — Best 3-letter words
- /blog/3-letter-words-with-x/ — 3-letter words with X
- /blog/3-letter-words-with-z/ — 3-letter words with Z

HIGH-SCORING WORDS:
- /blog/best-q-words-scrabble/ — Best Q words
- /blog/best-z-words-scrabble/ — Best Z words
- /blog/best-x-words-scrabble/ — Best X words
- /blog/best-j-words-scrabble/ — Best J words
- /blog/words-worth-50-plus-points/ — Words worth 50+ points
- /blog/words-worth-over-30-points/ — Words worth 30+ points
- /blog/best-words-for-premium-squares/ — Best words for premium squares
- /blog/best-words-for-triple-letter-squares/ — Triple letter square words
- /blog/best-words-for-double-word-squares/ — Double word square words

BINGOS (7-LETTER BONUS WORDS):
- /blog/best-7-letter-scrabble-words/ — Best 7-letter bingo words
- /blog/bingo-probability/ — Bingo probability analysis
- /blog/bingo-stem-strategy/ — Bingo stem strategy
- /blog/bingo-racks-to-memorise/ — Key bingo racks to memorise
- /blog/common-bingo-endings/ — Common bingo word endings
- /blog/bingo-training-methods/ — How to train for bingos

STRATEGY:
- /blog/beginner-scrabble-strategy/ — Beginner strategy guide
- /blog/rack-management-basics/ — Rack management basics
- /blog/rack-leave-explained/ — Rack leave strategy
- /blog/defensive-scrabble-strategy/ — Defensive strategy
- /blog/offensive-scrabble-strategy/ — Offensive strategy
- /blog/tile-tracking-guide/ — Tile tracking guide
- /blog/endgame-strategy/ — Endgame strategy
- /blog/blocking-triple-word-squares/ — Blocking triple word squares
- /blog/best-scrabble-opening-words/ — Best opening moves

RULES & DICTIONARIES:
- /blog/scrabble-rules-explained/ — Official rules explained
- /blog/scrabble-scoring-guide/ — Scoring guide
- /blog/how-blank-tiles-work/ — How blank tiles work
- /blog/understanding-premium-squares/ — Premium squares explained
- /blog/twl-tournament-word-list/ — TWL dictionary explained
- /blog/collins-official-dictionary/ — Collins/SOWPODS dictionary
- /blog/words-with-friends-vs-scrabble/ — Words With Friends vs Scrabble

LEARNING & IMPROVEMENT:
- /blog/how-to-win-scrabble/ — How to win at Scrabble
- /blog/common-scrabble-mistakes/ — Common mistakes to avoid
- /blog/roadmap-to-being-a-pro-player/ — Roadmap to becoming a pro
- /blog/becoming-a-tournament-player/ — Tournament preparation
- /blog/cognitive-benefits-of-scrabble/ — Cognitive benefits

SPECIAL WORD LISTS:
- /blog/words-without-vowels/ — Words without vowels
- /blog/words-using-all-5-vowels/ — Words using all 5 vowels
- /blog/best-vowel-heavy-words/ — Best vowel-heavy words
- /blog/best-consonant-heavy-words/ — Best consonant-heavy words
- /blog/words-with-silent-letters/ — Words with silent letters

TOOLS:
- / — Free word solver (homepage)
- /chat/ — Lex AI assistant (this chat)
- /activities/ — All daily word games in one place
- /diamond-hunt/ — Diamond Hunt treasure page
- /achievements/ — Personal word scoring milestones
- /mybag/ — Your star & diamond earnings

## Diamond Hunt
Diamond Hunt is a collectible treasure game on ScrabbleWordsFinder. Hidden diamond mines are placed across the site — blog articles, tool pages, activity hubs, and more. When users visit a page with an active mine, a floating 💎 gem appears. Clicking it claims the reward. Key facts:
- Each mine offers 1–100 diamonds per claim depending on rarity
- The Diamond Hunt page (/diamond-hunt/) shows all active mines, locations, and which ones the user has already claimed
- Diamonds earned from Diamond Hunt are separate from daily activity diamonds (star-bar diamonds)
- Mines reset periodically with new placements, so there is always something new to find
- Users need a user ID (auto-assigned on first game play) to participate
- Diamond Hunt is free, requires no sign-up, and works automatically while browsing

When a user asks about Diamond Hunt, encourage them to explore the site (read blog articles, try tools, visit different pages) and check /diamond-hunt/ to see all mine locations.

## Star Bar — Daily Progress System
The Star Bar sits at the top of the /activities/ page and tracks daily engagement. How it works:
- There are 7 daily games, each earning one ⭐ star per day: WOTD, Quiz, MWB (Memory WordBench), Rack, Anagram, 60s (Sixty-Second), and CaB (Cows and Bulls)
- Earn ALL 7 stars in one day → automatically earn a 💎 Diamond
- Your streak counts consecutive days where you earned at least one star
- The star bar shows: current day's stars, streak count, total stars earned (lifetime), total diamonds earned (lifetime)
- Stars reset daily — you earn a fresh set every day
- The diamond threshold is 7 stars (all games played)

## Achievements & Badges
Achievements are earned by finding words with the Scrabble solver on the homepage. When you click a word in the solver results and save it, you earn an achievement based on its point value:
- ⭐ Rising Star — 1–9 points
- 👍 Word Builder — 10–19 points
- 🔥 Hot Streak — 20–29 points
- 🏆 Triple Threat — 30–49 points
- 🌟 Legend — 50+ points

Users can view all their achievements at /achievements/ with word, score, level, notes, and date.

## Activities — All Games

The /activities/ page is the hub for all daily word games. Here is what each game involves:

### Word of the Day (WOTD)
A new vocabulary word every day with its meaning and a fun fact. Users can save it to their Memory WordBench for later review. Words are pre-assigned for years of daily coverage. Star earned: look up today's word.

### Word Quiz
A timed vocabulary quiz where users match words to their definitions. Options: 3–10 words per round, timer from 30–120 seconds, 4 multiple-choice options per question. Scores and history are tracked. Star earned: complete 1 quiz round.

### Memory WordBench (MWB)
A flashcard-style review of saved vocabulary words. Users add words from WOTD or the solver, then practice with auto-play card sessions. Star earned: auto-play 3+ cards.

### Daily Rack Challenge
Every day, all players get the same 7 Scrabble tiles (randomly generated from the Scrabble tile bag distribution). The goal: find the highest-scoring word from those tiles. Multiple submissions allowed — your best score for the day counts. Star earned: submit 1 valid word.

### Daily Anagram
A daily scrambled 5–8 letter word to unscramble. 5 guesses with Wordle-style colour feedback: 🟩 correct letter + correct position, 🟨 correct letter + wrong position, ⬜ not in word. A hint is available. Same puzzle for everyone each day. Star earned: make 1 guess.

### 60-Second Challenge
A timed word-finding game. You get 60 seconds to find as many valid Scrabble words as you can from a set of letters. Personal bests are tracked. Star earned: play 1 round.

### Cows and Bulls (CaB)
A word-guessing deduction game. The system picks a secret word (4–7 letters). You guess words and receive feedback: 🐂 Bull = right letter, right position. 🐄 Cow = right letter, wrong position. Optional countdown timer (30–90 seconds). History and coaching available. Star earned: solve 1 game.

When users ask about any game, explain how it works, offer tips, and link to /activities/ to play.`;

/**
 * Dictionary enrichment — detect word-related queries and inject real data
 * from the dictionary table so Lex answers with verified words + scores.
 */
async function getDictionaryContext(userMessage: string, db: any): Promise<string> {
  if (!db || !userMessage) return '';

  const msg = userMessage.toLowerCase();
  const queries: string[] = [];
  const results: any[] = [];

  try {
    // Pattern: "define X" or "what does X mean" or "meaning of X"
    const defineMatch = msg.match(/(?:define|meaning of|what does|what is|look up|lookup)\s+([a-z]+)/i);
    if (defineMatch) {
      const word = defineMatch[1].toUpperCase();
      const row = await db.prepare(
        'SELECT word, meaning, points, fun_fact, origin, spelling_tip FROM dictionary WHERE word = ? COLLATE NOCASE'
      ).bind(word).first();
      if (row) {
        results.push(`WORD LOOKUP — ${row.word}: ${row.meaning} (${row.points} points)${row.origin ? '. Origin: ' + row.origin : ''}${row.spelling_tip ? '. Spelling tip: ' + row.spelling_tip : ''}${row.fun_fact ? '. Fun fact: ' + row.fun_fact : ''}`);
      }
    }

    // Pattern: bingo words / 7-letter words
    if (msg.match(/\bbingo\b|7.?letter|seven.?letter/)) {
      const { results: rows } = await db.prepare(
        'SELECT word, meaning, points FROM dictionary WHERE LENGTH(word) >= 7 ORDER BY points DESC LIMIT 10'
      ).bind().all();
      if (rows?.length) {
        results.push('BINGO WORDS (7+ letters, from dictionary):\n' +
          rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
      }
    }

    // Pattern: Q without U / Q no U
    if (msg.match(/q\s*(without|no|w\/o)\s*u|q-no-u|q.without.u/i)) {
      const { results: rows } = await db.prepare(
        "SELECT word, meaning, points FROM dictionary WHERE word LIKE '%Q%' AND word NOT LIKE '%QU%' ORDER BY points DESC LIMIT 15"
      ).bind().all();
      if (rows?.length) {
        results.push('Q-WITHOUT-U WORDS (from dictionary):\n' +
          rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
      }
    }

    // Pattern: "N-letter words" or "words with N letters"
    const lengthMatch = msg.match(/(\d+).?letter\s*word|words?\s*(?:with|of)\s*(\d+)\s*letter/i);
    if (lengthMatch && !msg.match(/bingo/)) {
      const len = Number(lengthMatch[1] || lengthMatch[2]);
      if (len >= 2 && len <= 15) {
        // Check if also filtering by letter
        const letterFilter = msg.match(/with\s+([a-z])\b|containing\s+([a-z])\b|have\s+([a-z])\b/i);
        let query: string;
        let bindings: any[];

        if (letterFilter) {
          const letter = (letterFilter[1] || letterFilter[2] || letterFilter[3]).toUpperCase();
          query = "SELECT word, meaning, points FROM dictionary WHERE LENGTH(word) = ? AND word LIKE ? ORDER BY points DESC LIMIT 10";
          bindings = [len, `%${letter}%`];
        } else {
          query = "SELECT word, meaning, points FROM dictionary WHERE LENGTH(word) = ? ORDER BY points DESC LIMIT 10";
          bindings = [len];
        }

        const { results: rows } = await db.prepare(query).bind(...bindings).all();
        if (rows?.length) {
          const letterNote = letterFilter ? ` containing ${(letterFilter[1] || letterFilter[2] || letterFilter[3]).toUpperCase()}` : '';
          results.push(`${len}-LETTER WORDS${letterNote} (from dictionary):\n` +
            rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
        }
      }
    }

    // Pattern: words with specific letter (e.g. "words with Z", "Z words", "words containing X")
    const letterMatch = msg.match(/\b(?:words?\s*(?:with|containing|that\s*(?:have|contain|use))\s+(?:the\s+letter\s+)?|best\s+)([a-z])\s*words?\b|([a-z])\s*words?\b/i);
    if (letterMatch && !lengthMatch && !msg.match(/bingo|q\s*(?:without|no)/i)) {
      const letter = (letterMatch[1] || letterMatch[2]).toUpperCase();
      if (letter.length === 1) {
        const { results: rows } = await db.prepare(
          "SELECT word, meaning, points FROM dictionary WHERE word LIKE ? ORDER BY points DESC LIMIT 10"
        ).bind(`%${letter}%`).all();
        if (rows?.length) {
          results.push(`TOP WORDS WITH ${letter} (from dictionary):\n` +
            rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
        }
      }
    }

    // Pattern: "highest scoring" / "top scoring" / "best words" / "most points"
    if (msg.match(/highest.?scor|top.?scor|best\s*words|most\s*points|highest\s*point/i) && !letterMatch && !lengthMatch) {
      const { results: rows } = await db.prepare(
        'SELECT word, meaning, points FROM dictionary ORDER BY points DESC LIMIT 10'
      ).bind().all();
      if (rows?.length) {
        results.push('HIGHEST-SCORING WORDS (from dictionary):\n' +
          rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
      }
    }

    // Pattern: "2-letter words" / "two letter words" / "all two letter"
    if (msg.match(/\b(?:two|2).?letter\s*word|all\s*(?:two|2).?letter/i)) {
      const { results: rows } = await db.prepare(
        'SELECT word, meaning, points FROM dictionary WHERE LENGTH(word) = 2 ORDER BY points DESC LIMIT 20'
      ).bind().all();
      if (rows?.length) {
        results.push('TWO-LETTER WORDS (from dictionary):\n' +
          rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
      }
    }

    // Pattern: "words starting with X" / "words beginning with X"
    const startsMatch = msg.match(/words?\s*(?:starting|beginning)\s*with\s+([a-z]+)/i);
    if (startsMatch) {
      const prefix = startsMatch[1].toUpperCase();
      const { results: rows } = await db.prepare(
        'SELECT word, meaning, points FROM dictionary WHERE word LIKE ? ORDER BY points DESC LIMIT 10'
      ).bind(`${prefix}%`).all();
      if (rows?.length) {
        results.push(`WORDS STARTING WITH ${prefix} (from dictionary):\n` +
          rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
      }
    }

    // Pattern: "words ending with X"
    const endsMatch = msg.match(/words?\s*ending\s*(?:with|in)\s+([a-z]+)/i);
    if (endsMatch) {
      const suffix = endsMatch[1].toUpperCase();
      const { results: rows } = await db.prepare(
        'SELECT word, meaning, points FROM dictionary WHERE word LIKE ? ORDER BY points DESC LIMIT 10'
      ).bind(`%${suffix}`).all();
      if (rows?.length) {
        results.push(`WORDS ENDING WITH ${suffix} (from dictionary):\n` +
          rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
      }
    }

    // Pattern: random word / word of the day / teach me a word
    if (msg.match(/random\s*word|word\s*of\s*the\s*day|teach\s*me\s*a\s*word|surprise\s*me/i)) {
      const row = await db.prepare(
        'SELECT word, meaning, points, fun_fact, origin, spelling_tip FROM dictionary ORDER BY RANDOM() LIMIT 1'
      ).bind().first();
      if (row) {
        results.push(`RANDOM WORD — ${row.word}: ${row.meaning} (${row.points} points)${row.origin ? '. Origin: ' + row.origin : ''}${row.spelling_tip ? '. Spelling tip: ' + row.spelling_tip : ''}${row.fun_fact ? '. Fun fact: ' + row.fun_fact : ''}`);
      }
    }

  } catch {
    // Non-fatal — if dictionary lookup fails, AI still responds without enrichment
  }

  if (results.length === 0) return '';

  return '\n\n---\n📖 DICTIONARY DATA (use this verified data in your answer — these are real words with correct scores from our database):\n\n' +
    results.join('\n\n') +
    '\n\n---\nIMPORTANT: Use the dictionary data above as the primary source for your answer. Present these words with their exact meanings and point values. You may add strategy tips around them.';
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { messages } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: 'Messages array is required' }, 400);
  }

  // Limit conversation history to last 20 messages to stay within context limits
  const trimmedMessages = messages.slice(-20);

  const AI = (env as any).AI;
  if (!AI) {
    return json({ error: 'AI service unavailable' }, 503);
  }

  // Increment chatusage counter (fire-and-forget, don't block the response)
  const db = (env as any).DB;
  if (db) {
    db.prepare('UPDATE site_status SET chatusage = chatusage + 1 WHERE id = 1').run().catch(() => {});
  }

  // Get the latest user message for dictionary enrichment
  const lastUserMsg = trimmedMessages.filter((m: any) => m.role === 'user').pop();
  const userText = lastUserMsg?.content || '';

  // Detect quiz coaching request
  const isQuizCoaching = userText.includes('[QUIZ COACHING REQUEST]');

  // Detect CaB (Cows and Bulls) coaching request
  const isCabCoaching = userText.includes('[COWS AND BULLS — COACHING REQUEST]');

  // Enrich with dictionary data if the query is word-related (skip for quiz/cab coaching)
  let dictionaryContext = '';
  if (db && userText && !isQuizCoaching && !isCabCoaching) {
    dictionaryContext = await getDictionaryContext(userText, db);
  }

  // Quiz coaching system prompt addition
  const QUIZ_COACHING_PROMPT = `

---
QUIZ COACHING MODE ACTIVATED

The user is requesting personalized coaching based on their Word Quiz performance data.

CRITICAL FORMATTING RULES:
- Do NOT use numbered lists, section headers, or bold labels like "1. Acknowledge their effort:" or "**Performance Analysis:**"
- Write in flowing, natural paragraphs — like a coach talking to a player after a game
- Each paragraph should naturally transition to the next theme without announcing what it is
- Never output structural markers — the user should NOT see the skeleton of your response

Your response should flow through these themes naturally (but NEVER label them):

THEME A — WARM OPENER: Start by recognising how many rounds they've played. Weave it into a natural opening sentence. Example: "Hey! You've knocked out X quiz rounds — that's real dedication to sharpening your word game."

THEME B — PERFORMANCE PATTERNS: Analyse their accuracy, timing, and timeout rate conversationally. Look for these patterns and mention them naturally:
- Very fast answers (< 3s) → might be guessing without reading all options
- Frequent timeouts → timer might be too long, or they're overthinking
- Low accuracy + high speed → rushing
- High accuracy + slow speed → cautious but effective
- Many slow answers (> 10s) → struggling with certain word types

THEME C — ACTIONABLE TIPS: Give 3-5 specific tips woven into your paragraphs (not as a bullet list). Use their actual numbers. Examples of what to say naturally:
- "You're blasting through X% of questions in under 3 seconds — try reading every choice before clicking, you might be jumping too fast."
- "With X timeouts, dropping your timer from Xs to Ys might help — better to finish with a few wrong than run out of time."
- "Those missed words — [words] — are worth studying. Pop them into Memory WordBench and review before your next round."

THEME D — PER-QUESTION COMMENTARY: If the user's data includes specific words they got right or wrong, weave in comments about 3-5 individual words. Use VARIED phrasing — never repeat the same style twice. Examples:
- Correct: "QUIXOTIC — sharp recall on that one, it's a tournament favorite." / "ZEPHYR — nice, most casual players miss that." / "ADZE — that's a word that separates serious players from beginners."
- Wrong: "TAEL — tricky one, it catches even experienced players." / "NAEVI — don't worry, that's a common stumbling block at all levels."
- Progress: "You're getting faster at the longer words." / "Your accuracy on high-point tiles is climbing."

THEME E — ENCOURAGING CLOSE: End with a natural suggestion for their next step. Don't say "here's some encouragement" — just BE encouraging. Example: "For your next round, try 5 questions with a 60-second timer to push your speed. Or revisit those missed words in Memory WordBench first — either way, you're building something solid here."

STYLE RULES:
- Write in flowing paragraphs, not lists or numbered steps
- Use the actual numbers from their stats — never be vague
- Vary your language every time — never give the same response twice
- Sound like a friendly coach, not a report card
- Keep it concise — 4-6 short paragraphs max, not a wall of text

FIRST-TIME USER (NO QUIZ HISTORY):
If the user has 0 rounds played or no performance data at all, they are a first-time visitor. Do NOT say "you haven't played yet" in a dry way. Instead, give them a warm welcome and useful Scrabble wisdom to get started:
- Welcome them enthusiastically to the Word Quiz
- Share 2-3 practical Scrabble vocabulary tips (e.g., learn all two-letter words, know the Q-without-U words, memorize common 3-letter words with high-value tiles)
- Suggest they start with a short quiz (3-5 questions, 90s timer) to ease in
- Mention that the more they play, the more personalized your coaching becomes
- Keep the same flowing paragraph style — no lists, no headers
---`;

  const CAB_COACHING_PROMPT = `

---
COWS AND BULLS COACHING MODE ACTIVATED

The user is requesting personalized coaching based on their Cows and Bulls game history.

Cows and Bulls is a word-deduction game: the player guesses a secret word of a chosen length (4–7 letters). After each guess they receive 🐂 (bull = right letter, right position) and 🐄 (cow = right letter, wrong position). The goal is to deduce the word in as few guesses as possible.

CRITICAL FORMATTING RULES:
- Do NOT use numbered lists, section headers, or bold labels
- Write in flowing, natural paragraphs — like a coach talking to a player after a game
- Each paragraph should naturally transition to the next theme without announcing what it is
- Never output structural markers — the user should NOT see the skeleton of your response

Your response should flow through these themes naturally (but NEVER label them):

THEME A — WARM OPENER: Acknowledge how many games they've played and their solve rate conversationally. Make it feel personal to their specific numbers.

THEME B — PERFORMANCE PATTERNS: Analyse their stats naturally. Look for these patterns:
- High solve rate (>80%) → strong deductive reasoning, compliment consistency
- Low solve rate (<50%) → may need better elimination strategies, mention gently
- Low average attempts (< 3.5) → excellent deducer, near expert level
- High average attempts (> 5) → struggling to narrow down letters, suggest systematic elimination
- Many quick solves (≤3 guesses) → instinctive pattern matching, impressive
- Preferred word length → note if they gravitate toward shorter/longer words and what that suggests

THEME C — ACTIONABLE TIPS: Give 3-4 specific tips woven into your paragraphs (not as a bullet list). Tailor them to their actual numbers. Examples of what to say naturally:
- "Starting with a word that covers common vowels and consonants — like TRAIN, STALE, or CRANE — gives you maximum information on your first guess."
- "When you get a cow, resist the urge to just shuffle the letter — think about every position it can't be in and eliminate systematically."
- "Keeping a mental (or physical) alphabet of eliminated letters is the single biggest skill separator between casual and strong players."
- "With X games at a Y-letter difficulty, you're clearly comfortable with that length — try stepping up to Z letters occasionally to sharpen your elimination chains."

THEME D — GAME-SPECIFIC COMMENTARY: Weave in observations from their recent game history (dates, results, word lengths). Vary your phrasing each time. Examples:
- Solved quickly: "That 2-guess solve is a standout — pure deduction at its best."
- Long solve: "The longer games aren't failures — they're where you learn the most about which letters you tend to overlook."
- Unsolved: "A game you didn't crack is always worth revisiting mentally — what letter combinations did you not consider?"

THEME E — ENCOURAGING CLOSE: End with a natural, specific suggestion. Examples:
- "Try starting your next few games with STARE — it covers S, T, A, R, E, five of the most common English letters, and you'll get rich feedback immediately."
- "Your solving speed is already solid — next step is tightening up that first guess to get maximum letter coverage."

STYLE RULES:
- Write in flowing paragraphs, not lists or numbered steps
- Use the actual numbers from their stats — never be vague
- Sound like a friendly coach, not a performance review
- Keep it concise — 4-6 short paragraphs max

FIRST-TIME USER (NO GAME HISTORY):
If the user has 0 games played, welcome them warmly and explain:
- How the game works (🐂 = right letter right spot, 🐄 = right letter wrong spot)
- The best opening strategy (start with a word covering common letters like STARE, CRANE, TRAIN)
- How to use cow feedback effectively — think of where the letter CAN'T be, not just where it might be
- Encourage them to try a 4-letter game first to get the feel for it
- Keep the same flowing paragraph style — warm, no bullet lists
---`;

  // Build system prompt — inject dictionary data, quiz coaching, or CaB coaching context
  let enrichedSystemPrompt = SYSTEM_PROMPT;
  if (isQuizCoaching) {
    enrichedSystemPrompt += QUIZ_COACHING_PROMPT;
  } else if (isCabCoaching) {
    enrichedSystemPrompt += CAB_COACHING_PROMPT;
  } else if (dictionaryContext) {
    enrichedSystemPrompt += dictionaryContext;
  }

  try {
    const response = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: enrichedSystemPrompt },
        ...trimmedMessages,
      ],
      max_tokens: isQuizCoaching || isCabCoaching ? 1024 : 512,
      stream: true,
    });

    // Workers AI returns a ReadableStream for streamed responses
    return new Response(response, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (e: any) {
    return json({ error: e.message || 'AI inference failed' }, 500);
  }
};

// Reject non-POST methods
export const GET: APIRoute = async () => {
  return json({ error: 'Method not allowed. Use POST.' }, 405);
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
