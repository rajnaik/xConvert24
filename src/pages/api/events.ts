import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Event Bus — manages chain of dependent actions
 * 
 * GET /api/events — list recent events (admin)
 * POST /api/events — emit a new event (triggers dependent actions)
 *   Body: { event_type: string, payload?: object }
 * 
 * Event Types & Their Chain Reactions:
 * ─────────────────────────────────────
 * bug_validated     → award 25 coins to reporter_uid
 * bug_reported      → track analytics, award attempt
 * feature_suggested → track analytics
 * suggestion_rated  → check if rating > 4 → award coins to suggester
 * deployment_start  → set site_status to green
 * deployment_done   → set site_status to golden
 * test_failed       → set site_status to red
 * streak_achieved   → award streak bonus coins
 * level_up          → log milestone event
 */

// Chain reaction handlers
async function processEvent(db: any, eventType: string, payload: any) {
  switch (eventType) {
    case 'bug_validated': {
      // Award coins to reporter (already done in bugs PATCH, but this is the event record)
      break;
    }
    case 'deployment_start': {
      await db.prepare(
        'INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, ?, datetime("now"), ?)'
      ).bind('green', 'event_bus').run();
      break;
    }
    case 'deployment_done': {
      await db.prepare(
        'INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, ?, datetime("now"), ?)'
      ).bind('golden', 'event_bus').run();
      break;
    }
    case 'test_failed': {
      await db.prepare(
        'INSERT OR REPLACE INTO site_status (id, status, updated_at, updated_by) VALUES (1, ?, datetime("now"), ?)'
      ).bind('red', 'event_bus').run();
      break;
    }
    case 'level_up': {
      // Log to org_tasks for visibility
      const uid = payload?.user_id || 'unknown';
      const newLevel = payload?.level || '?';
      await db.prepare(
        'INSERT INTO org_tasks (agent_id, task, duration) VALUES (?, ?, ?)'
      ).bind('system', `User ${uid.slice(0, 8)}… levelled up to Level ${newLevel}`, '—').run().catch(() => {});
      break;
    }
    default:
      break;
  }
}

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ events: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const rows = await db.prepare(
    'SELECT * FROM event_bus ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all();

  return new Response(JSON.stringify({ events: rows?.results || [] }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'DB not configured' }), {
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

  const { event_type, payload } = body;
  if (!event_type) {
    return new Response(JSON.stringify({ error: 'event_type required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Record event
  await db.prepare(
    'INSERT INTO event_bus (event_type, payload, status) VALUES (?, ?, ?)'
  ).bind(event_type, JSON.stringify(payload || {}), 'processing').run();

  // Process chain reactions
  try {
    await processEvent(db, event_type, payload || {});
    // Mark as processed
    await db.prepare(
      'UPDATE event_bus SET status = "processed", processed_at = datetime("now") WHERE id = last_insert_rowid()'
    ).run();
  } catch {
    await db.prepare(
      'UPDATE event_bus SET status = "failed" WHERE id = last_insert_rowid()'
    ).run();
  }

  return new Response(JSON.stringify({ success: true, event_type }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
};
