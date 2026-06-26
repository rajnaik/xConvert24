import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;
const getCache = () => (env as any).CACHE as KVNamespace | undefined;

const CACHE_TTL = 3600; // 1 hour

/**
 * POST /api/constants/cache — Force-refresh the KV cache with all active constants.
 * Writes each constant individually (const:name:<NAME>) plus the full list (const:list:active).
 * Returns the count of constants cached.
 */
export const POST: APIRoute = async () => {
  const db = getDB();
  const kv = getCache();

  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });
  if (!kv) return new Response(JSON.stringify({ error: 'CACHE KV not available' }), { status: 500 });

  try {
    // 1. Clear all existing constant cache keys
    const listed = await kv.list({ prefix: 'const:' });
    if (listed.keys.length > 0) {
      await Promise.all(listed.keys.map((k) => kv.delete(k.name)));
    }

    // 2. Fetch all active constants from DB
    const { results } = await db.prepare(
      'SELECT id, name, text, description, category, status, updated_at, updated_by, created_at FROM constants WHERE status = 1 ORDER BY category, name'
    ).all();

    // 3. Write each constant individually for fast single lookups
    const writes: Promise<void>[] = [];
    for (const row of results) {
      const key = `const:name:${(row as any).name}`;
      writes.push(kv.put(key, JSON.stringify({ constant: row }), { expirationTtl: CACHE_TTL }));
    }

    // 4. Write the full active list
    writes.push(kv.put('const:list:active', JSON.stringify({ constants: results }), { expirationTtl: CACHE_TTL }));

    // 5. Write the full list (all constants including inactive) 
    const { results: allResults } = await db.prepare(
      'SELECT id, name, text, description, category, status, updated_at, updated_by, created_at FROM constants ORDER BY category, name'
    ).all();
    writes.push(kv.put('const:list', JSON.stringify({ constants: allResults }), { expirationTtl: CACHE_TTL }));

    await Promise.all(writes);

    return new Response(JSON.stringify({
      success: true,
      cached: results.length,
      total: allResults.length,
      message: `Cache refreshed: ${results.length} active constants cached to KV`
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
