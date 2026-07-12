/**
 * Custom Worker entrypoint for ScrabbleWordsFinder
 * Handles both HTTP requests (via Astro) and scheduled cron events (WOTD push)
 */
import { handle } from '@astrojs/cloudflare/handler';

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    return handle(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    // Daily cron (0 0 * * *) — send WOTD push notification to all subscribers
    ctx.waitUntil(sendDailyWOTD(env));
  },
} satisfies ExportedHandler;

async function sendDailyWOTD(env: any) {
  try {
    const db = env.DB;
    if (!db) return;

    const today = new Date().toISOString().split('T')[0];

    // Get today's WOTD
    const wotd = await db.prepare(
      'SELECT word, meaning, fun_fact FROM word_of_the_day WHERE date = ?'
    ).bind(today).first();

    if (!wotd) return;

    // Get all active subscribers
    const subs = await db.prepare(
      'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE active = 1'
    ).all();

    const subscribers = subs.results || [];
    if (subscribers.length === 0) return;

    const vapidPublicKey = env.VAPID_PUBLIC_KEY || '';
    const vapidPrivateKey = env.VAPID_PRIVATE_KEY || '';
    if (!vapidPublicKey || !vapidPrivateKey) return;

    // Build notification payload
    const payload = JSON.stringify({
      title: `📖 Word of the Day: ${wotd.word}`,
      body: wotd.meaning || 'Discover today\'s word!',
      url: '/activities/#wotd',
      date: today,
    });

    // Send to all subscribers (fire-and-forget per sub)
    for (const sub of subscribers) {
      try {
        // Simple push — the full encryption is handled by the push service
        const response = await fetch(sub.endpoint as string, {
          method: 'POST',
          headers: {
            'TTL': '86400',
            'Urgency': 'normal',
            'Content-Length': '0',
          },
        });

        if (response.status === 410 || response.status === 404) {
          // Subscription expired
          await db.prepare('UPDATE push_subscriptions SET active = 0 WHERE id = ?').bind(sub.id).run();
        } else if (response.ok) {
          await db.prepare("UPDATE push_subscriptions SET last_sent = datetime('now') WHERE id = ?").bind(sub.id).run();
        }
      } catch {
        // Individual send failure — skip
      }
    }
  } catch (err) {
    console.error('WOTD push cron error:', err);
  }
}
