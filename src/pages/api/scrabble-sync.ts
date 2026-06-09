import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/scrabble-sync?uid=USER_ID — fetch saved scrabble achievements from DB
 * POST /api/scrabble-sync — save scrabble achievements to DB
 *   Body: { uid: string, achievements: Array<{word,meaning}>, dictionary?: string }
 */

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ achievements: [], dictionary: 'sowpods' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const uid = url.searchParams.get('uid');
  if (!uid) {
    return new Response(JSON.stringify({ error: 'uid required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const row = await db.prepare('SELECT achievements, dictionary FROM scrabble_sync WHERE user_id = ?').bind(uid).first();
  if (!row) {
    return new Response(JSON.stringify({ achievements: [], dictionary: 'sowpods' }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let achievements = [];
  try { achievements = JSON.parse(row.achievements || '[]'); } catch { achievements = []; }

  return new Response(JSON.stringify({ achievements, dictionary: row.dictionary || 'sowpods' }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { uid, achievements, dictionary } = body;
  if (!uid || !Array.isArray(achievements)) {
    return new Response(JSON.stringify({ error: 'uid and achievements[] required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const achievementsJson = JSON.stringify(achievements);
  const dict = dictionary || 'sowpods';

  await db.prepare(
    `INSERT OR REPLACE INTO scrabble_sync (user_id, achievements, dictionary, updated_at) VALUES (?, ?, ?, datetime('now'))`
  ).bind(uid, achievementsJson, dict).run();

  return new Response(JSON.stringify({ success: true, count: achievements.length }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
