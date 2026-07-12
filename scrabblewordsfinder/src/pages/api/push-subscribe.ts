/**
 * /api/push-subscribe/ — Manage Web Push notification subscriptions
 *
 * POST: Save a new push subscription (or reactivate existing)
 * DELETE: Unsubscribe (mark as inactive)
 * GET: Return VAPID public key + subscription count
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const getDB = () => (env as any).DB;

// VAPID public key — safe to expose (the private key is in Worker secrets)
const VAPID_PUBLIC_KEY = (env as any).VAPID_PUBLIC_KEY || '';

export const GET: APIRoute = async () => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  const count = await db.prepare('SELECT COUNT(*) as total FROM push_subscriptions WHERE active = 1').first();

  return json({
    vapidPublicKey: VAPID_PUBLIC_KEY,
    subscriberCount: count?.total || 0,
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  try {
    const body = await request.json() as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
      userId?: string;
    };

    const { endpoint, keys, userId } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return json({ error: 'Missing required fields: endpoint, keys.p256dh, keys.auth' }, 400);
    }

    // Upsert — if endpoint exists, reactivate it
    await db.prepare(`
      INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id, active, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'))
      ON CONFLICT(endpoint) DO UPDATE SET
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_id = excluded.user_id,
        active = 1
    `).bind(endpoint, keys.p256dh, keys.auth, userId || '').run();

    return json({ success: true, message: 'Subscribed to WOTD notifications' });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to subscribe' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  try {
    const body = await request.json() as { endpoint?: string };

    if (!body.endpoint) {
      return json({ error: 'Missing endpoint' }, 400);
    }

    await db.prepare('UPDATE push_subscriptions SET active = 0 WHERE endpoint = ?')
      .bind(body.endpoint).run();

    return json({ success: true, message: 'Unsubscribed' });
  } catch (err: any) {
    return json({ error: err.message || 'Failed to unsubscribe' }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
