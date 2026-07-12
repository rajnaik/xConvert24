/**
 * /api/embed/ — Generate embeddings + upsert to Vectorize
 * 
 * Uses the Worker AI binding (no external API token needed).
 * Requires X-Embed-Key header matching the EMBED_SECRET Worker secret.
 * 
 * POST /api/embed/
 * Headers: X-Embed-Key: <secret>
 * Body: { "texts": ["text1", "text2", ...], "ids": ["id1", "id2", ...], "metadata": [{...}, {...}] }
 * 
 * - texts: array of strings to embed (max 100 per request)
 * - ids: matching vector IDs for Vectorize upsert (optional — if omitted, only returns embeddings)
 * - metadata: matching metadata objects for each vector (optional)
 * 
 * Returns: { "success": true, "embedded": N, "upserted": N }
 */

import { env } from 'cloudflare:workers';

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    // Auth check — require X-Embed-Key header matching EMBED_SECRET
    const secret = (env as any).EMBED_SECRET;
    const providedKey = request.headers.get('X-Embed-Key');
    if (secret && providedKey !== secret) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as {
      texts?: string[];
      ids?: string[];
      metadata?: Record<string, unknown>[];
    };

    const { texts, ids, metadata } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'texts array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (texts.length > 100) {
      return new Response(JSON.stringify({ success: false, error: 'Max 100 texts per request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate embeddings via AI binding
    const ai = (env as any).AI;
    const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: texts.map((t: string) => t.slice(0, 512)), // Truncate to 512 chars
    });

    if (!result?.data || result.data.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'AI model returned no embeddings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const embedded = result.data.length;
    let upserted = 0;

    // If IDs provided, upsert into Vectorize
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const vectorize = (env as any).VECTORIZE;
      const vectors = ids.map((id: string, i: number) => ({
        id,
        values: result.data[i],
        metadata: metadata?.[i] || {},
      }));

      await vectorize.upsert(vectors);
      upserted = vectors.length;
    }

    return new Response(JSON.stringify({
      success: true,
      embedded,
      upserted,
      // Only return raw embeddings if no IDs (caller just wants vectors)
      ...(ids ? {} : { data: result.data }),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
