import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { classifyQuery } from '../../lib/lex-classifier';
import { scoreRack, rackQualitySummary } from '../../lib/rack-quality';
import { QUIZ_COACHING_PROMPT, CAB_COACHING_PROMPT, RACK_COACHING_PROMPT, ANAGRAM_COACHING_PROMPT } from '../../lib/coaching-prompts';

const SYSTEM_PROMPT = `You are Lex, the AI Scrabble assistant on ScrabbleWordsFinder.com. You ONLY help with Scrabble, word games, English language, and certain other languages if you can. You do NOT answer questions about any other topic.

STRICT RULE: If a user asks about anything unrelated to Scrabble, word games, vocabulary, language, or strategy, politely and respectfully inform them: "I appreciate the question, but I'm Lex — your Scrabble and word game coach! I specialise in Scrabble strategy, word suggestions, rules, rack advice, vocabulary, and language. Is there a word game topic I can help you with?"

CRITICAL WORD VALIDITY RULE:
- NEVER say a common English word is "not valid in Scrabble" unless you are 100% certain.
- The SOWPODS dictionary contains over 270,000 words. Almost ALL standard English words are valid.
- ALL regular plurals (-S), past tenses (-ED), gerunds (-ING), and comparatives (-ER, -EST) of valid base words are themselves valid.
- For example: ARRESTS, PLAYING, QUIZZES, JOKERS, FOXES, GLAZED — ALL valid.
- If a user asks "is X a valid word?" and X is a recognisable English word (noun, verb, adjective, or their inflected forms), say it IS valid unless it's a proper noun or abbreviation.
- When uncertain, say "I believe X is valid in SOWPODS — verify with the solver above for certainty" rather than falsely claiming it's invalid.
- NEVER confidently state a word is invalid. If unsure, direct the user to check with the solver.

BINGO DEFINITION (CRITICAL — do NOT get this wrong):
- A BINGO in Scrabble is ANY valid word that uses ALL 7 tiles from your rack.
- The ONLY criterion is: the word has exactly 7 letters AND uses all 7 tiles on your rack.
- There are NO other "bingo criteria." No special word lists. No extra rules.
- Examples of bingos: ARRESTS (7 letters), PLAYING (7 letters), STRANGE (7 letters), QUILTED (7 letters) — ALL are bingos if you play them using all 7 rack tiles.
- A bingo earns a 50-point bonus in addition to the word's regular score.
- NEVER say "X is not a bingo" for a valid 7-letter word. If it's 7 letters and valid, it IS a bingo.

WORD SCORING (CRITICAL — do NOT calculate scores yourself):
- You CANNOT reliably do arithmetic. NEVER calculate Scrabble tile scores in your head.
- Standard tile values: A=1,B=3,C=3,D=2,E=1,F=4,G=2,H=4,I=1,J=8,K=5,L=1,M=3,N=1,O=1,P=3,Q=10,R=1,S=1,T=1,U=1,V=4,W=4,X=8,Y=4,Z=10.
- When a user asks about a word's score, provide the breakdown by listing each letter's value but state: "Use the solver above for the exact total" if you're unsure of your addition.
- For multiple words or ranked lists, direct users to the solver rather than listing scores you calculated yourself.
- ALWAYS end score-related answers with: "⚠️ Note: Scores shown are approximate. Use the Word Finder above for verified totals."

Your expertise includes:
- Scrabble rules (official NASPA/TWL and international SOWPODS dictionaries)
- Word strategy (high-scoring words, rack management, tile tracking)
- Board control (triple word squares, blocking, parallel plays)
- Two-letter words, Q-without-U words, and other key word lists
- Scoring optimisation (bingo bonuses, premium square usage)
- Tournament preparation and time management
- Rack analysis: when given a rack of tiles, suggest the best word(s) to play with scores
- Cows and Bulls: a word-guessing deduction game where players guess a secret word and receive 🐂 (right letter, right position) and 🐄 (right letter, wrong position) feedback

## Quick-Reference Word Lists (use these in answers when relevant)

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

Guidelines:
- Keep answers concise and practical (2-4 paragraphs max)
- When suggesting words, ALWAYS mention their Scrabble point value
- If asked about word validity, clarify which dictionary (TWL vs SOWPODS) you're referencing
- Be encouraging — help players of all skill levels
- NEVER answer questions about cooking, maths, science, history, politics, programming, or any non-word-game topic
- Never make up words — if unsure whether a word is valid, say so
- When your answer relates to a topic below, include 1-2 relevant links from the Blog Link Map as markdown links. Format: [link text](url). Only link when genuinely relevant — do not force links.
- When given a rack of letters, analyse what words can be formed and recommend the highest-scoring option
- When users ask about two-letter words, Q-without-U words, high-scoring words, or rare letter words, reference the Quick-Reference Word Lists above with specific words and scores

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

When users ask about any game, explain how it works, offer tips, and link to /activities/ to play.

## IMPORTANT: Always Include Relevant Blog Links
At the END of every response, include 1-3 relevant blog article links from the list above. Format them as:
📚 **Read more:**
- [Article title](/blog/slug/) — brief description

Choose links that are most relevant to what the user asked about. For example:
- Question about rack strategy → link to rack-management-basics and rack-leave-explained
- Question about bingos → link to bingo-stem-strategy and best-7-letter-scrabble-words
- Question about scoring → link to scrabble-scoring-guide and highest-scoring-scrabble-words
- Question about rules → link to scrabble-rules-explained
- General tips → link to how-to-win-scrabble and beginner-scrabble-strategy

ALWAYS include at least one link. This helps users dive deeper into the topic.`;

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
        const isBingo = row.word.length === 7;
        const bingoNote = isBingo ? ' 🎉 BINGO WORD! (7 letters = uses all rack tiles = +50 bonus points).' : ` (Not a bingo — ${row.word.length} letters.)`;
        results.push(`WORD LOOKUP — ${row.word}: ${row.meaning || 'Valid Scrabble word'} (${row.points} points)${bingoNote}${row.origin ? '. Origin: ' + row.origin : ''}${row.spelling_tip ? '. Spelling tip: ' + row.spelling_tip : ''}${row.fun_fact ? '. Fun fact: ' + row.fun_fact : ''}`);
      } else {
        results.push(`WORD LOOKUP — ${word}: NOT FOUND in our SOWPODS dictionary (may not be a valid Scrabble word)`);
      }
    }

    // Pattern: "is X a valid word" / "is X a scrabble word" / "can I play X" / "is X allowed"
    const validityMatch = msg.match(/(?:is\s+)([a-z]+)\s+(?:a\s+)?(?:valid|scrabble|legal|allowed|real|playable|acceptable)/i)
      || msg.match(/(?:can\s+(?:i|you)\s+play|is\s+)([a-z]+)\s+(?:a\s+word|in\s+scrabble|valid)/i);
    if (validityMatch && !defineMatch) {
      const word = validityMatch[1].toUpperCase();
      if (word.length >= 2 && word.length <= 15) {
        const row = await db.prepare(
          'SELECT word, meaning, points FROM dictionary WHERE word = ? COLLATE NOCASE'
        ).bind(word).first();
        if (row) {
          const isBingo = row.word.length === 7;
          const bingoNote = isBingo ? ` 🎉 This is also a BINGO word (7 letters = all tiles used = +50 bonus, total ${row.points + 50} points)!` : ` (Not a bingo — ${row.word.length} letters, bingo requires exactly 7.)`;
          results.push(`WORD VALIDITY CHECK — ✅ YES, ${row.word} IS a valid Scrabble word in SOWPODS. Score: ${row.points} points. ${row.meaning ? 'Meaning: ' + row.meaning : ''}${bingoNote}`);
        } else {
          results.push(`WORD VALIDITY CHECK — ❌ ${word} was NOT FOUND in our SOWPODS dictionary. It may not be a valid Scrabble word.`);
        }
      }
    }

    // Pattern: bingo words / 7-letter words
    if (msg.match(/\bbingo\b|7.?letter|seven.?letter/)) {
      // First check if user is asking about a specific word being a bingo
      const bingoWordMatch = msg.match(/(?:is\s+)([a-z]+)\s+(?:a\s+)?bingo/i);
      if (bingoWordMatch) {
        const word = bingoWordMatch[1].toUpperCase();
        const row = await db.prepare(
          'SELECT word, meaning, points FROM dictionary WHERE word = ? COLLATE NOCASE'
        ).bind(word).first();
        if (row && row.word.length === 7) {
          results.push(`BINGO CHECK — ✅ YES! ${row.word} is a valid bingo word (7 letters, uses all tiles). Score: ${row.points} points + 50 bonus = ${row.points + 50} total. ${row.meaning ? 'Meaning: ' + row.meaning : ''}`);
        } else if (row && row.word.length !== 7) {
          results.push(`BINGO CHECK — ❌ ${row.word} is a valid word (${row.word.length} letters, ${row.points} pts) but NOT a bingo because it's not 7 letters. A bingo requires exactly 7 letters using all tiles from your rack.`);
        } else {
          results.push(`BINGO CHECK — ❌ ${word} was not found in the dictionary.`);
        }
      } else {
        const { results: rows } = await db.prepare(
          'SELECT word, meaning, points FROM dictionary WHERE LENGTH(word) >= 7 ORDER BY points DESC LIMIT 10'
        ).bind().all();
        if (rows?.length) {
          results.push('BINGO WORDS (7+ letters, from dictionary):\n' +
            rows.map((r: any) => `• ${r.word} — ${r.meaning} (${r.points} pts)`).join('\n'));
        }
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

  // Detect rack coaching request
  const isRackCoaching = userText.includes('[DAILY RACK CHALLENGE — COACHING REQUEST]');

  // Detect anagram coaching request
  const isAnagramCoaching = userText.includes('[DAILY ANAGRAM — COACHING REQUEST]');

  // Enrich with dictionary data if the query is word-related (skip for coaching modes)
  let dictionaryContext = '';
  if (db && userText && !isQuizCoaching && !isCabCoaching && !isRackCoaching && !isAnagramCoaching) {
    dictionaryContext = await getDictionaryContext(userText, db);
  }

  // ── RAG: Semantic search for relevant blog content ──
  let ragContext = '';
  if (!isQuizCoaching && !isCabCoaching && !isRackCoaching && !isAnagramCoaching) {
    try {
      const VECTORIZE = (env as any).VECTORIZE;
      const AI = (env as any).AI;
      if (VECTORIZE && AI) {
        // Generate embedding for the user's question
        const embResult = await AI.run('@cf/baai/bge-base-en-v1.5', { text: [userText] });
        const queryVector = embResult?.data?.[0];
        if (queryVector) {
          // Query Vectorize for top 3 most relevant blog chunks
          const matches = await VECTORIZE.query(queryVector, { topK: 3, returnMetadata: 'all' });
          if (matches?.matches?.length > 0) {
            const relevantChunks = matches.matches
              .filter((m: any) => m.score > 0.65) // Only high-relevance matches
              .map((m: any) => {
                const slug = m.metadata?.slug || '';
                const url = m.metadata?.url || '';
                // Retrieve the text content from the vector metadata or reconstruct
                return `[Source: ${url}]\n${m.metadata?.text || slug}`;
              });
            if (relevantChunks.length > 0) {
              ragContext = '\n\n---\n📚 RELEVANT BLOG ARTICLES (reference these in your answer and cite the URLs):\n\n' + relevantChunks.join('\n\n') + '\n\nWhen referencing these, format as: "Read more: [title](/blog/slug/)".\n---';
            }
          }
        }
      }
    } catch {
      // RAG is non-critical — if it fails, Lex still answers from its training
    }
  }

  // Build system prompt — inject dictionary data or coaching context (prompts imported from shared lib)
  let enrichedSystemPrompt = SYSTEM_PROMPT;
  if (isQuizCoaching) {
    enrichedSystemPrompt += QUIZ_COACHING_PROMPT;
  } else if (isCabCoaching) {
    enrichedSystemPrompt += CAB_COACHING_PROMPT;
  } else if (isRackCoaching) {
    enrichedSystemPrompt += RACK_COACHING_PROMPT;
  } else if (isAnagramCoaching) {
    enrichedSystemPrompt += ANAGRAM_COACHING_PROMPT;
  } else if (dictionaryContext) {
    enrichedSystemPrompt += dictionaryContext;
  }

  // Append RAG context (for any non-coaching query)
  if (ragContext) {
    enrichedSystemPrompt += ragContext;
  }

  // --- SMART MODEL ROUTING ---
  // Classify query complexity to pick the right model
  const hasGameContext = isQuizCoaching || isCabCoaching || isRackCoaching || isAnagramCoaching;
  const classification = classifyQuery(userText, trimmedMessages.length, hasGameContext);

  // Force 70B for coaching modes (always need full power)
  const selectedModel = (isQuizCoaching || isCabCoaching || isRackCoaching || isAnagramCoaching)
    ? '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
    : classification.model;
  const selectedMaxTokens = (isQuizCoaching || isCabCoaching || isRackCoaching || isAnagramCoaching)
    ? 1024
    : classification.maxTokens;

  // --- RACK QUALITY ENRICHMENT ---
  // If the user mentions a rack (7 letters), inject EV analysis into context
  const rackPattern = /\b([A-Z?]{7})\b/;
  const rackMatch = userText.toUpperCase().match(rackPattern);
  if (rackMatch && !isQuizCoaching && !isCabCoaching && !isRackCoaching && !isAnagramCoaching) {
    const rackSummary = rackQualitySummary(rackMatch[1]);
    enrichedSystemPrompt += `\n\n---\n📊 RACK QUALITY ANALYSIS:\n${rackSummary}\nUse this data to inform your coaching. Mention the rack's quality score and percentile naturally in your response.\n---`;
  }

  try {
    // Primary model call
    const response = await AI.run(selectedModel, {
      messages: [
        { role: 'system', content: enrichedSystemPrompt },
        ...trimmedMessages,
      ],
      max_tokens: selectedMaxTokens,
      stream: true,
      repetition_penalty: 1.3,
      temperature: 0.7,
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
    // --- LATENCY FALLBACK ---
    // If the powerful model fails/times out, try the fast model
    if (selectedModel.includes('70b')) {
      try {
        const fallbackResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
          messages: [
            { role: 'system', content: enrichedSystemPrompt },
            ...trimmedMessages,
          ],
          max_tokens: 384,
          stream: true,
        });
        return new Response(fallbackResponse, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch {
        // Both models failed
      }
    }
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
