import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

// POST /api/memorised-words/ — mark a word as memorised
// Body: { userid: string, word: string }
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json();
    const { userid, word } = body as { userid?: string; word?: string };

    if (!userid || !word) {
      return new Response(JSON.stringify({ error: 'userid and word are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await db.prepare('INSERT OR IGNORE INTO memorised_words (userid, word) VALUES (?, ?)').bind(userid, word.toUpperCase()).run();

    return new Response(JSON.stringify({ success: true, word: word.toUpperCase() }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET /api/memorised-words/?userid=xxx — get all memorised words for a user
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  const url = new URL(request.url);
  const userid = url.searchParams.get('userid');

  if (!userid) {
    return new Response(JSON.stringify({ error: 'userid is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const result = await db.prepare('SELECT word, created_at FROM memorised_words WHERE userid = ? ORDER BY created_at DESC LIMIT 500').bind(userid).all();

  return new Response(JSON.stringify({ words: result.results }), { headers: { 'Content-Type': 'application/json' } });
};

// DELETE /api/memorised-words/ — remove a word from memorised list
// Body: { userid: string, word: string }
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json();
    const { userid, word } = body as { userid?: string; word?: string };

    if (!userid || !word) {
      return new Response(JSON.stringify({ error: 'userid and word are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await db.prepare('DELETE FROM memorised_words WHERE userid = ? AND word = ?').bind(userid, word.toUpperCase()).run();

    return new Response(JSON.stringify({ success: true, word: word.toUpperCase() }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
