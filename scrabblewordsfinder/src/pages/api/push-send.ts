/**
 * /api/push-send/ — Send WOTD push notification to all subscribers
 *
 * POST: Manually trigger (admin)
 * Also called by the scheduled cron trigger (daily at midnight UTC)
 *
 * Requires VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY secrets.
 * Uses the Web Push protocol directly (no npm dependency needed).
 */

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const getDB = () => (env as any).DB;

// Web Push requires signing with VAPID keys
// We use the Web Crypto API available in Workers

async function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function getTodayWOTD(db: any) {
  const today = await getToday();
  const row = await db.prepare(
    'SELECT word, meaning, fun_fact FROM word_of_the_day WHERE date = ?'
  ).bind(today).first();
  return row;
}

/**
 * Create a signed Web Push request using VAPID (RFC 8292)
 * This is a simplified implementation using Cloudflare Workers crypto
 */
async function sendPushNotification(subscription: any, payload: string, vapidPrivateKey: string, vapidPublicKey: string) {
  const { endpoint, p256dh, auth } = subscription;

  // For Web Push, we need to:
  // 1. Encrypt the payload using the subscription's p256dh and auth keys
  // 2. Sign the request with VAPID keys
  //
  // Since this is complex crypto, we use a simplified approach:
  // Send via the endpoint with proper VAPID authorization header

  const audience = new URL(endpoint).origin;
  const vapidToken = await createVAPIDToken(audience, vapidPrivateKey, vapidPublicKey);

  // Encrypt payload using Web Push encryption (simplified — sends as plaintext for now)
  // Full encryption requires ECDH key agreement + HKDF + AES-GCM
  // For production, use web-push library or implement RFC 8291

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${vapidToken.token}, k=${vapidPublicKey}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400', // 24 hours
      'Urgency': 'normal',
    },
    body: await encryptPayload(payload, p256dh, auth),
  });

  return { status: response.status, ok: response.ok, endpoint: endpoint.slice(0, 60) };
}

/**
 * Create VAPID JWT token for authorization
 */
async function createVAPIDToken(audience: string, privateKeyBase64: string, publicKeyBase64: string) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 86400, // 24h
    sub: 'mailto:contact@scrabblewordsfinder.com',
  };

  const headerB64 = base64url(JSON.stringify(header));
  const claimsB64 = base64url(JSON.stringify(claims));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  // Import private key and sign
  const keyData = base64urlDecode(privateKeyBase64);
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64url(new Uint8Array(signature));
  return { token: `${unsignedToken}.${signatureB64}` };
}

/**
 * Encrypt push payload using Web Push Encryption (RFC 8291)
 * Simplified: for initial implementation, sends empty body and relies on
 * notification data being in the VAPID claims or uses a simpler approach.
 *
 * TODO: Implement full RFC 8291 encryption for payload delivery.
 * For now, we send a minimal encrypted payload.
 */
async function encryptPayload(payload: string, _p256dh: string, _auth: string): Promise<ArrayBuffer> {
  // Placeholder — full implementation requires ECDH + HKDF + AES-128-GCM
  // For MVP, we'll use an alternative approach in the POST handler
  return new TextEncoder().encode(payload);
}

function base64url(data: string | Uint8Array): string {
  const str = typeof data === 'string' ? btoa(data) : btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): ArrayBuffer {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = (str + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return json({ error: 'DB not available' }, 500);

  const vapidPrivateKey = (env as any).VAPID_PRIVATE_KEY || '';
  const vapidPublicKey = (env as any).VAPID_PUBLIC_KEY || '';

  if (!vapidPrivateKey || !vapidPublicKey) {
    return json({ error: 'VAPID keys not configured. Run: npx web-push generate-vapid-keys' }, 500);
  }

  // Get today's WOTD
  const wotd = await getTodayWOTD(db);
  if (!wotd) {
    return json({ error: 'No WOTD found for today' }, 404);
  }

  // Build notification payload
  const payload = JSON.stringify({
    title: `📖 Word of the Day: ${wotd.word}`,
    body: wotd.meaning || 'Discover today\'s word!',
    url: '/activities/#wotd',
    date: await getToday(),
  });

  // Get all active subscriptions
  const subs = await db.prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE active = 1').all();
  const subscribers = subs.results || [];

  if (subscribers.length === 0) {
    return json({ success: true, sent: 0, message: 'No active subscribers' });
  }

  // Send to all subscribers
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    try {
      const result = await sendPushNotification(sub, payload, vapidPrivateKey, vapidPublicKey);
      if (result.ok) {
        sent++;
        // Update last_sent timestamp
        await db.prepare('UPDATE push_subscriptions SET last_sent = datetime(\'now\') WHERE id = ?').bind(sub.id).run();
      } else if (result.status === 410 || result.status === 404) {
        // Subscription expired — mark inactive
        await db.prepare('UPDATE push_subscriptions SET active = 0 WHERE id = ?').bind(sub.id).run();
        failed++;
      } else {
        failed++;
        errors.push(`${result.endpoint}: ${result.status}`);
      }
    } catch (err: any) {
      failed++;
      errors.push(`${(sub.endpoint as string).slice(0, 40)}: ${err.message}`);
    }
  }

  return json({
    success: true,
    word: wotd.word,
    meaning: wotd.meaning,
    sent,
    failed,
    total: subscribers.length,
    errors: errors.slice(0, 5), // Only show first 5 errors
  });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
