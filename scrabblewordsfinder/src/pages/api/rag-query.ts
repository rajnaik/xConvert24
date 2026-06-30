/**
 * RAG Query API — Public endpoint (enhanced)
 * 
 * POST /api/rag-query/
 * Accepts a user question and responds intelligently:
 * 1. Word lookups → checks D1 for definitions + calculates Scrabble score
 * 2. Blog-relevant questions → uses Vectorize RAG + LLM
 * 3. General Scrabble questions → uses LLM with general knowledge + any relevant blog context
 * 4. Conversational comments → responds naturally as a Scrabble coach
 * 
 * Body: { question: string, topK?: number }
 * Returns: { answer: string, sources: [{ slug, title, category, score }] }
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

// Rate limiting: track queries per IP (simple in-memory, resets on deploy)
const queryCount = new Map<string, { count: number; resetAt: number }>();
const MAX_QUERIES_PER_HOUR = 60;

// Scrabble letter values
const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5,
  L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4,
  W: 4, X: 8, Y: 4, Z: 10
};

function scoreWord(word: string): number {
  return word.toUpperCase().split('').reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
}

/**
 * Detect if the user is asking about a specific word (definition, meaning, validity, score)
 */
function detectWordLookup(question: string): string | null {
  const q = question.trim();
  
  // Patterns: "what does X mean", "define X", "what is X", "is X a word", "X meaning"
  const patterns = [
    /^(?:what\s+does?\s+)["']?(\w{2,15})["']?\s+mean/i,
    /^(?:define|meaning\s+of)\s+["']?(\w{2,15})["']?/i,
    /^(?:what\s+is\s+)["']?(\w{2,15})["']?\s*\??$/i,
    /^(?:is\s+)["']?(\w{2,15})["']?\s+(?:a\s+)?(?:valid\s+)?(?:scrabble\s+)?word/i,
    /^["']?(\w{2,15})["']?\s+(?:meaning|definition|score|points)/i,
    /^(?:how\s+many\s+points?\s+(?:is|for)\s+)["']?(\w{2,15})["']?/i,
    /^(?:score\s+(?:of|for)\s+)["']?(\w{2,15})["']?/i,
    // Single word query (2-15 chars, just the word itself)
    /^([A-Za-z]{2,15})$/,
  ];

  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

/**
 * Look up a word in our database tables (WOTD, daily_anagram, daily_rack)
 */
async function lookupWord(DB: any, word: string): Promise<{ meaning: string; funFact: string } | null> {
  const upper = word.toUpperCase();

  // Check word_of_the_day
  const wotd = await DB.prepare(
    `SELECT meaning, fun_fact FROM word_of_the_day WHERE UPPER(word) = ? AND meaning != '' LIMIT 1`
  ).bind(upper).first();
  if (wotd?.meaning) return { meaning: wotd.meaning, funFact: wotd.fun_fact || '' };

  // Check daily_anagram
  const anagram = await DB.prepare(
    `SELECT meaning FROM daily_anagram WHERE UPPER(word) = ? AND meaning != '' LIMIT 1`
  ).bind(upper).first();
  if (anagram?.meaning) return { meaning: anagram.meaning, funFact: '' };

  // Check daily_rack
  const rack = await DB.prepare(
    `SELECT meaning FROM daily_rack WHERE UPPER(best_word) = ? AND meaning != '' LIMIT 1`
  ).bind(upper).first();
  if (rack?.meaning) return { meaning: rack.meaning, funFact: '' };

  return null;
}

export const POST: APIRoute = async ({ request }) => {
  const AI = (env as any).AI;
  const VECTORIZE = (env as any).VECTORIZE;
  const DB = (env as any).DB;

  if (!AI || !VECTORIZE || !DB) {
    return new Response(JSON.stringify({ error: 'Service unavailable' }), { 
      status: 503, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { question, topK = 5 } = await request.json() as { question: string; topK?: number };

    if (!question || typeof question !== 'string' || question.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Question must be at least 2 characters' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (question.length > 500) {
      return new Response(JSON.stringify({ error: 'Question too long (max 500 characters)' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // --- WORD LOOKUP PATH (exempt from rate limit — no AI/Vectorize cost) ---
    const wordLookup = detectWordLookup(question);
    if (wordLookup) {
      const score = scoreWord(wordLookup);
      const lookup = await lookupWord(DB, wordLookup);

      if (lookup) {
        const answer = `**${wordLookup}** (${score} points)\n\n${lookup.meaning}${lookup.funFact ? `\n\n💡 ${lookup.funFact}` : ''}`;
        return new Response(JSON.stringify({ answer, sources: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Word not in our DB — falls through to LLM (counts against rate limit)
    }

    // Rate limiting (only for LLM-powered queries — word lookups above are free)
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const tracker = queryCount.get(ip);
    if (tracker && tracker.resetAt > now) {
      if (tracker.count >= MAX_QUERIES_PER_HOUR) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), { 
          status: 429, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      tracker.count++;
    } else {
      queryCount.set(ip, { count: 1, resetAt: now + 3600000 });
    }

    // --- RAG + LLM PATH ---
    // 1. Generate embedding for the user's question
    const embeddingResult = await AI.run('@cf/baai/bge-base-en-v1.5', { 
      text: [question] 
    });

    if (!embeddingResult?.data?.[0]) {
      return new Response(JSON.stringify({ error: 'Failed to process question' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Query Vectorize for similar chunks
    const queryVector = embeddingResult.data[0];
    const vectorResults = await VECTORIZE.query(queryVector, { 
      topK: Math.min(topK, 10),
      returnMetadata: 'all'
    });

    // 3. Determine relevance quality
    const matches = vectorResults?.matches || [];
    const topScore = matches.length > 0 ? matches[0].score : 0;
    const hasGoodContext = topScore > 0.65; // Only use blog context if relevance is decent

    // 4. Retrieve chunk texts from D1 (if relevant matches exist)
    let context = '';
    let sources: Array<{ slug: string; title: string; category: string; score: number }> = [];

    if (hasGoodContext && matches.length > 0) {
      const vectorIds = matches.filter((m: any) => m.score > 0.55).map((m: any) => m.id);
      if (vectorIds.length > 0) {
        const placeholders = vectorIds.map(() => '?').join(',');
        const { results: chunks } = await DB.prepare(
          `SELECT vector_id, slug, title, category, content FROM rag_chunks WHERE vector_id IN (${placeholders})`
        ).bind(...vectorIds).all();

        if (chunks && chunks.length > 0) {
          context = chunks.map((c: any) => c.content).join('\n\n---\n\n');

          // Build unique sources
          const seenSlugs = new Set<string>();
          sources = matches
            .filter((m: any) => m.score > 0.55)
            .filter((m: any) => {
              const slug = m.metadata?.slug || m.id.split('_')[0];
              if (seenSlugs.has(slug)) return false;
              seenSlugs.add(slug);
              return true;
            })
            .map((m: any) => ({
              slug: m.metadata?.slug || m.id.split('_')[0],
              title: m.metadata?.title || '',
              category: m.metadata?.category || '',
              score: Math.round(m.score * 100) / 100
            }))
            .slice(0, 3);
        }
      }
    }

    // 5. Build system prompt — conversational Scrabble coach
    const systemPrompt = `You are Lex, a friendly and knowledgeable Scrabble coach on ScrabbleWordsFinder.com. You help players improve their game.

Your personality:
- Warm, encouraging, and enthusiastic about Scrabble
- You give practical tips players can use right away
- You celebrate good plays and gently suggest improvements
- You speak casually but knowledgeably

What you can help with:
- Scrabble rules, strategy, and tactics
- Word suggestions, definitions, and scoring
- Two-letter words, bingos, hooks, and other advanced concepts
- Board positioning, rack management, tile tracking
- Tournament play and competitive tips
- General word game knowledge (Words With Friends, crosswords, anagrams)

Rules:
- Keep answers concise: 2-4 sentences for simple questions, a short paragraph for complex ones
- When you mention specific words, include their Scrabble point value when relevant
- If someone just types a word, give its score and a brief definition if you know it
- If someone makes a comment (like "I love playing Scrabble"), respond conversationally
- If you use information from the blog context below, great — but you can also use your general Scrabble knowledge
- Never say "I don't have information about that" — instead give your best knowledge and note if you're less certain
- Use markdown bold for word mentions (e.g. **QI** — 11 points)`;

    // 6. Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add blog context if relevant
    if (context) {
      messages.push({ 
        role: 'system', 
        content: `Relevant information from our blog articles (use this to enrich your answer):\n\n${context}` 
      });
    }

    // If this was a word lookup that failed DB check, add that context
    if (wordLookup) {
      const score = scoreWord(wordLookup);
      messages.push({
        role: 'system',
        content: `The user is asking about the word "${wordLookup}" which scores ${score} points in Scrabble. Provide its definition, whether it's valid in Scrabble (SOWPODS/TWL), and any strategic tips about using it.`
      });
    }

    messages.push({ role: 'user', content: question });

    // 7. Generate answer
    const llmResult = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 500,
      temperature: 0.5
    });

    const answer = llmResult?.response || "Hmm, I'm having trouble thinking right now. Try asking again in a moment!";

    return new Response(JSON.stringify({ answer, sources }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Internal error', detail: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
