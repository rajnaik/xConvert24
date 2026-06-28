/**
 * RAG Query API — Public endpoint
 * 
 * POST /api/rag-query/
 * Accepts a user question, generates an embedding, queries Vectorize
 * for similar chunks, retrieves the text from D1, and uses Workers AI
 * LLM to generate a contextual answer.
 * 
 * Body: { question: string, topK?: number }
 * Returns: { answer: string, sources: [{ slug, title, category, score }] }
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

// Rate limiting: track queries per IP (simple in-memory, resets on deploy)
const queryCount = new Map<string, { count: number; resetAt: number }>();
const MAX_QUERIES_PER_HOUR = 20;

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

  // Simple rate limiting by IP
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

  try {
    const { question, topK = 5 } = await request.json() as { question: string; topK?: number };

    if (!question || typeof question !== 'string' || question.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Question must be at least 3 characters' }), { 
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

    // 1. Generate embedding for the user's question
    const embeddingResult = await AI.run('@cf/baai/bge-base-en-v1.5', { 
      text: [question] 
    });

    if (!embeddingResult?.data?.[0]) {
      return new Response(JSON.stringify({ error: 'Failed to generate question embedding' }), { 
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

    if (!vectorResults?.matches || vectorResults.matches.length === 0) {
      return new Response(JSON.stringify({ 
        answer: "I don't have enough information about that topic yet. Try asking about Scrabble strategy, word lists, two-letter words, bingos, or game rules.",
        sources: [] 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 3. Retrieve chunk texts from D1
    const vectorIds = vectorResults.matches.map((m: any) => m.id);
    const placeholders = vectorIds.map(() => '?').join(',');
    const { results: chunks } = await DB.prepare(
      `SELECT vector_id, slug, title, category, content FROM rag_chunks WHERE vector_id IN (${placeholders})`
    ).bind(...vectorIds).all();

    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ 
        answer: "I found relevant topics but couldn't retrieve the content. Please try again.",
        sources: [] 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 4. Build context from retrieved chunks
    const contextParts = chunks.map((c: any) => c.content);
    const context = contextParts.join('\n\n---\n\n');

    // 5. Generate answer using LLM with context
    const systemPrompt = `You are a helpful Scrabble expert assistant for ScrabbleWordsFinder.com. Answer questions about Scrabble strategy, rules, word lists, and tips using ONLY the context provided. If the context doesn't contain enough information to answer fully, say so. Keep answers concise (2-4 sentences for simple questions, up to a paragraph for complex ones). Always mention specific words, scores, or strategies when relevant. Do not make up information not in the context.`;

    const llmResult = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `Context from our blog articles:\n\n${context}` },
        { role: 'user', content: question }
      ],
      max_tokens: 400,
      temperature: 0.3
    });

    const answer = llmResult?.response || "I couldn't generate an answer. Please try rephrasing your question.";

    // 6. Build unique sources list (deduplicate by slug)
    const seenSlugs = new Set<string>();
    const sources = vectorResults.matches
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
      .slice(0, 3); // Max 3 unique sources

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
