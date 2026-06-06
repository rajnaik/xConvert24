import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/bugs — list all bugs sorted by votes desc
 * POST /api/bugs — submit a new bug report
 * PATCH /api/bugs — validate a bug (admin) → triggers reward for reporter
 *   Body: { id: string, validated: boolean }
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT id, page, href, severity, description, email, votes, validated, reporter_uid, created_at FROM bugs ORDER BY votes DESC, created_at DESC'
  ).all();

  return new Response(JSON.stringify({ bugs: results }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { page, href, severity, description, email, reporter_uid } = body;
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Description is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const validSeverity = ['low', 'medium', 'high'].includes(severity) ? severity : 'low';

  await db.prepare(
    'INSERT INTO bugs (id, page, href, severity, description, email, reporter_uid) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, page || '', href || '', validSeverity, description.trim(), email || '', reporter_uid || '').run();

  return new Response(JSON.stringify({ success: true, id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id, validated } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Bug id required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const validatedInt = validated ? 1 : 0;
  await db.prepare('UPDATE bugs SET validated = ? WHERE id = ?').bind(validatedInt, id).run();

  // If validating (not un-validating), trigger reward for reporter
  if (validated) {
    const bug = await db.prepare('SELECT reporter_uid FROM bugs WHERE id = ?').bind(id).first();
    if (bug?.reporter_uid) {
      // Emit event to event bus
      await db.prepare(
        'INSERT INTO event_bus (event_type, payload) VALUES (?, ?)'
      ).bind('bug_validated', JSON.stringify({ bug_id: id, reporter_uid: bug.reporter_uid })).run();

      // Award coins directly
      const uid = bug.reporter_uid;
      const reward = 25;
      const existing = await db.prepare('SELECT * FROM user_coins WHERE id = ?').bind(uid).first();
      if (existing) {
        const newTotal = (existing.total_earned || 0) + reward;
        const level = Math.max(1, Math.floor(newTotal / 500) + 1);
        await db.prepare('UPDATE user_coins SET coins = coins + ?, total_earned = ?, level = ? WHERE id = ?')
          .bind(reward, newTotal, level, uid).run();
      } else {
        await db.prepare('INSERT INTO user_coins (id, coins, streak, level, last_active, total_earned) VALUES (?, ?, 0, 1, datetime("now"), ?)')
          .bind(uid, reward, reward).run();
      }
      await db.prepare('INSERT INTO coin_events (user_id, activity, coins) VALUES (?, ?, ?)')
        .bind(uid, 'bug_validated', reward).run();
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
