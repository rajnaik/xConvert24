/**
 * RAG Ingest API — Admin-only endpoint
 * 
 * POST /api/rag-ingest/
 * Accepts a batch of text chunks, generates embeddings via Workers AI,
 * stores chunk text in D1 (rag_chunks), and upserts vectors to Vectorize.
 * 
 * Body: { chunks: [{ slug, title, category, chunk_index, content }] }
 * Max batch size: 20 chunks per request (Workers AI embedding model limit)
 * 
 * DELETE /api/rag-ingest/
 * Clears all RAG data (rag_chunks table + Vectorize index)
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const AI = (env as any).AI;
  const VECTORIZE = (env as any).VECTORIZE;
  const DB = (env as any).DB;

  if (!AI || !VECTORIZE || !DB) {
    return new Response(JSON.stringify({ error: 'Missing AI, VECTORIZE, or DB binding' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { chunks } = await request.json() as { 
      chunks: Array<{ slug: string; title: string; category: string; chunk_index: number; content: string }> 
    };

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return new Response(JSON.stringify({ error: 'No chunks provided' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (chunks.length > 20) {
      return new Response(JSON.stringify({ error: 'Max 20 chunks per batch' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 1. Generate embeddings for all chunks in batch
    const texts = chunks.map(c => c.content);
    const embeddingResult = await AI.run('@cf/baai/bge-base-en-v1.5', { text: texts });

    if (!embeddingResult?.data || embeddingResult.data.length !== chunks.length) {
      return new Response(JSON.stringify({ error: 'Embedding generation failed', detail: embeddingResult }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Store chunks in D1 and prepare vectors for Vectorize
    const vectors: Array<{ id: string; values: number[]; metadata?: Record<string, string> }> = [];
    const inserted: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vectorId = `${chunk.slug}_${chunk.chunk_index}`;

      // Insert into D1 (upsert — replace if vector_id exists)
      await DB.prepare(
        `INSERT OR REPLACE INTO rag_chunks (vector_id, slug, chunk_index, content, title, category) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(vectorId, chunk.slug, chunk.chunk_index, chunk.content, chunk.title, chunk.category).run();

      // Prepare vector for Vectorize
      vectors.push({
        id: vectorId,
        values: embeddingResult.data[i],
        metadata: {
          slug: chunk.slug,
          title: chunk.title,
          category: chunk.category
        }
      });

      inserted.push(vectorId);
    }

    // 3. Upsert vectors to Vectorize in one batch
    await VECTORIZE.upsert(vectors);

    return new Response(JSON.stringify({ 
      success: true, 
      inserted: inserted.length,
      vector_ids: inserted 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};

export const DELETE: APIRoute = async () => {
  const DB = (env as any).DB;
  const VECTORIZE = (env as any).VECTORIZE;

  if (!DB) {
    return new Response(JSON.stringify({ error: 'Missing DB binding' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    // Get all vector IDs before clearing
    const { results } = await DB.prepare('SELECT vector_id FROM rag_chunks').all();
    const vectorIds = results?.map((r: any) => r.vector_id) || [];

    // Clear D1 table
    await DB.prepare('DELETE FROM rag_chunks').run();

    // Delete vectors from Vectorize (in batches of 100)
    if (vectorIds.length > 0 && VECTORIZE) {
      for (let i = 0; i < vectorIds.length; i += 100) {
        const batch = vectorIds.slice(i, i + 100);
        await VECTORIZE.deleteByIds(batch);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      cleared_chunks: vectorIds.length 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
