import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');
  if (!uid) return new Response(JSON.stringify({ error: 'uid required' }), { status: 400 });

  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ achievements: [], dictionary: 'sowpods' }));

  try {
    const row = await db.prepare('SELECT achievements, dictionary FROM scrabble_sync WHERE uid = ?').bind(uid).first();
    if (!row) return new Response(JSON.stringify({ achievements: [], dictionary: 'sowpods' }));
    return new Response(JSON.stringify({
      achievements: JSON.parse(row.achievements as string),
      dictionary: row.dictionary,
    }));
  } catch {
    return new Response(JSON.stringify({ achievements: [], dictionary: 'sowpods' }));
  }
};

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON' }), { status: 400 });
  }

  const { uid, achievements, dictionary } = body;
  if (!uid || !achievements) return new Response(JSON.stringify({ error: 'uid and achievements required' }), { status: 400 });

  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ ok: false, error: 'no database' }), { status: 500 });

  try {
    await db.prepare(
      `INSERT INTO scrabble_sync (uid, achievements, dictionary, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(uid) DO UPDATE SET
         achievements = excluded.achievements,
         dictionary = excluded.dictionary,
         updated_at = datetime('now')`
    ).bind(uid, JSON.stringify(achievements), dictionary || 'sowpods').run();

    return new Response(JSON.stringify({ ok: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
};
