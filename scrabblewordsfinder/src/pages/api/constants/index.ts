import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;
const getCache = () => (env as any).CACHE as KVNamespace | undefined;

const ALL_COLS = 'id, name, text, description, category, status, updated_at, updated_by, created_at';
const CACHE_TTL = 3600; // 1 hour in seconds

// --- KV Cache Helpers ---

/** Build a cache key for a specific query pattern */
function cacheKey(params: { name?: string; category?: string; active?: string }): string {
  if (params.name) return `const:name:${params.name}`;
  const parts = ['const:list'];
  if (params.category) parts.push(`cat:${params.category}`);
  if (params.active === 'true') parts.push('active');
  return parts.join(':');
}

/** Read from KV cache. Returns parsed JSON or null if miss. */
async function cacheGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  try {
    const raw = await kv.get(key, 'text');
    if (raw) return JSON.parse(raw) as T;
  } catch { /* cache miss or parse error — fall through to DB */ }
  return null;
}

/** Write to KV cache with TTL */
async function cacheSet(kv: KVNamespace, key: string, value: unknown): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(value), { expirationTtl: CACHE_TTL });
  } catch { /* best-effort — don't fail the request if cache write fails */ }
}

/** Invalidate all constants cache keys and re-populate with fresh DB data (write-through). */
async function cacheRefresh(kv: KVNamespace, db: any): Promise<void> {
  try {
    // 1. Delete all existing constant cache keys
    const listed = await kv.list({ prefix: 'const:' });
    if (listed.keys.length > 0) {
      await Promise.all(listed.keys.map((k) => kv.delete(k.name)));
    }

    // 2. Fetch fresh data from DB
    const { results: allResults } = await db.prepare(
      `SELECT ${ALL_COLS} FROM constants ORDER BY category, name`
    ).all();
    const activeResults = allResults.filter((r: any) => r.status === 1);

    // 3. Write-through: immediately populate cache with fresh data
    const writes: Promise<void>[] = [];

    // Individual keys for each constant
    for (const row of allResults) {
      writes.push(kv.put(`const:name:${(row as any).name}`, JSON.stringify({ constant: row }), { expirationTtl: CACHE_TTL }));
    }

    // List keys
    writes.push(kv.put('const:list', JSON.stringify({ constants: allResults }), { expirationTtl: CACHE_TTL }));
    writes.push(kv.put('const:list:active', JSON.stringify({ constants: activeResults }), { expirationTtl: CACHE_TTL }));

    // Category-specific lists
    const categories = [...new Set(allResults.map((r: any) => r.category).filter(Boolean))];
    for (const cat of categories) {
      const catResults = allResults.filter((r: any) => r.category === cat);
      writes.push(kv.put(`const:list:cat:${cat}`, JSON.stringify({ constants: catResults }), { expirationTtl: CACHE_TTL }));
      const catActive = catResults.filter((r: any) => r.status === 1);
      writes.push(kv.put(`const:list:cat:${cat}:active`, JSON.stringify({ constants: catActive }), { expirationTtl: CACHE_TTL }));
    }

    await Promise.all(writes);
  } catch { /* best-effort — don't fail the mutation if cache refresh fails */ }
}

// --- API Routes ---

// GET /api/constants — get all constants
// GET /api/constants?name=TAGLINE — get a single constant by name
// GET /api/constants?category=branding — filter by category
// GET /api/constants?active=true — only active (status=1)
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const kv = getCache();
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  const category = url.searchParams.get('category');
  const active = url.searchParams.get('active');

  const key = cacheKey({ name: name || undefined, category: category || undefined, active: active || undefined });

  try {
    // --- Single constant by name ---
    if (name) {
      // Try cache first
      if (kv) {
        const cached = await cacheGet<{ constant: any }>(kv, key);
        if (cached) {
          return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
        }
      }

      const row = await db.prepare(`SELECT ${ALL_COLS} FROM constants WHERE name = ?`).bind(name).first();
      if (!row) return new Response(JSON.stringify({ error: 'Constant not found' }), { status: 404 });

      const payload = { constant: row };
      if (kv) await cacheSet(kv, key, payload);
      return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
    }

    // --- List with optional filters ---
    // Try cache first
    if (kv) {
      const cached = await cacheGet<{ constants: any[] }>(kv, key);
      if (cached) {
        return new Response(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
      }
    }

    let query = `SELECT ${ALL_COLS} FROM constants`;
    const conditions: string[] = [];
    const binds: any[] = [];

    if (category) {
      conditions.push('category = ?');
      binds.push(category);
    }
    if (active === 'true') {
      conditions.push('status = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY category, name';

    const stmt = binds.length > 0
      ? db.prepare(query).bind(...binds)
      : db.prepare(query);

    const { results } = await stmt.all();
    const payload = { constants: results };
    if (kv) await cacheSet(kv, key, payload);
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// PUT /api/constants — update a constant
// Body: { name: string, text?: string, description?: string, category?: string, status?: number }
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const kv = getCache();

  try {
    const body = await request.json();
    const { name } = body;
    if (!name) {
      return new Response(JSON.stringify({ error: 'name is required' }), { status: 400 });
    }

    // Build dynamic SET clause from provided fields
    const allowed = ['text', 'description', 'category', 'status'];
    const sets: string[] = [];
    const binds: any[] = [];

    for (const field of allowed) {
      if (body[field] !== undefined) {
        sets.push(`${field} = ?`);
        binds.push(body[field]);
      }
    }

    if (sets.length === 0) {
      return new Response(JSON.stringify({ error: 'name and text are required' }), { status: 400 });
    }

    // Always update timestamps
    sets.push("updated_at = datetime('now')");
    sets.push("updated_by = ?");
    binds.push(body.updated_by || 'admin');
    binds.push(name); // for WHERE clause

    const sql = `UPDATE constants SET ${sets.join(', ')} WHERE name = ?`;
    const result = await db.prepare(sql).bind(...binds).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Constant not found' }), { status: 404 });
    }

    // Write-through: refresh cache with fresh DB data
    if (kv) await cacheRefresh(kv, db);

    const updated = await db.prepare(`SELECT ${ALL_COLS} FROM constants WHERE name = ?`).bind(name).first();
    return new Response(JSON.stringify({ constant: updated }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// POST /api/constants — create a new constant
// Body: { name: string, text: string, description?: string, category?: string, status?: number }
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const kv = getCache();

  try {
    const body = await request.json();
    const { name, text, description, category, status: constStatus } = body;

    if (!name || text === undefined) {
      return new Response(JSON.stringify({ error: 'name and text are required' }), { status: 400 });
    }

    const desc = description || '';
    const cat = category || 'general';
    const stat = constStatus !== undefined ? constStatus : 1;
    const updatedBy = body.updated_by || 'admin';

    await db.prepare(
      `INSERT INTO constants (name, text, description, category, status, updated_at, updated_by, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, datetime('now'))`
    ).bind(name, text, desc, cat, stat, updatedBy).run();

    // Write-through: refresh cache with fresh DB data
    if (kv) await cacheRefresh(kv, db);

    const created = await db.prepare(`SELECT ${ALL_COLS} FROM constants WHERE name = ?`).bind(name).first();
    return new Response(JSON.stringify({ constant: created }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return new Response(JSON.stringify({ error: `Constant already exists` }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// DELETE /api/constants — delete a constant by id
// Body: { id: number }
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const kv = getCache();

  try {
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
    }

    const result = await db.prepare('DELETE FROM constants WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Constant not found' }), { status: 404 });
    }

    // Write-through: refresh cache with fresh DB data
    if (kv) await cacheRefresh(kv, db);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
