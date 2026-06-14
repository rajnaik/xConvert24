import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { user_id, achievement_id, encouragement_words, score, word } = await request.json();
    if (!user_id || !achievement_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    await db.prepare(
      'INSERT INTO user_achievements (user_id, achievement_id, encouragement_words, score, word) VALUES (?, ?, ?, ?, ?)'
    ).bind(user_id, achievement_id, encouragement_words || '', score || 0, word || '').run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    const userId = url.searchParams.get('user_id');
    let results;
    if (userId) {
      results = await db.prepare('SELECT * FROM user_achievements WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(userId).all();
    } else {
      results = await db.prepare('SELECT * FROM user_achievements ORDER BY created_at DESC LIMIT 50').all();
    }

    return new Response(JSON.stringify({ achievements: results.results }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { id, encouragement_words } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500 });
    }

    await db.prepare('UPDATE user_achievements SET encouragement_words = ? WHERE id = ?')
      .bind(encouragement_words || '', id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), { status: 500 });
  }
};
