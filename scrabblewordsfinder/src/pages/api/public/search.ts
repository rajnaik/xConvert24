import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/public/search/?q=bingo strategy — Knowledge Base Search (public, read-only)
 *
 * Searches the blog RAG index (Vectorize) for relevant articles.
 * Returns ranked results with titles, slugs, and relevance snippets.
 *
 * Query params:
 *   ?q= (required) search query
 *   ?limit=5 (default, max 10)
 *
 * Cached for 5 minutes.
 */

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const ai = (env as any).AI;
  const vectorize = (env as any).VECTORIZE;
  if (!ai || !vectorize) return jsonError('Search not available', 503);

  const query = url.searchParams.get('q');
  if (!query || query.trim().length < 2) {
    return jsonError('Query parameter ?q= is required (min 2 chars)', 400);
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '5'), 10);

  try {
    // Generate embedding for the search query
    const embedResult = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: [query.trim()],
    });

    const queryVector = embedResult?.data?.[0];
    if (!queryVector) return jsonError('Failed to generate search embedding', 500);

    // Search Vectorize index
    const results = await vectorize.query(queryVector, {
      topK: limit,
      returnMetadata: 'all',
    });

    const matches = (results?.matches || []).map((m: any) => ({
      title: m.metadata?.title || '',
      slug: m.metadata?.slug || '',
      url: m.metadata?.slug ? `https://www.scrabblewordsfinder.com/blog/${m.metadata.slug}/` : '',
      snippet: m.metadata?.chunk?.slice(0, 200) || '',
      score: Math.round((m.score || 0) * 100) / 100,
    }));

    return new Response(JSON.stringify({
      query: query.trim(),
      results: matches,
      total: matches.length,
      source: 'ScrabbleWordsFinder.com',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return jsonError(e.message, 500);
  }
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
