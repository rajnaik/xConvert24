import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * /api/chat-heartbeat — Check AI binding health
 *
 * GET /api/chat-heartbeat → { healthy: true/false, chatusage: number }
 *
 * Tests whether the Workers AI binding is available and responsive.
 * Used by the admin dashboard to show green/red status on the chatusage button.
 */

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  const AI = (env as any).AI;

  let chatusage = 0;

  // Fetch current chatusage from site_status
  if (db) {
    try {
      const row = await db.prepare('SELECT chatusage FROM site_status WHERE id = 1').first();
      if (row) chatusage = row.chatusage ?? 0;
    } catch { /* non-fatal */ }
  }

  // Check if AI binding exists
  if (!AI) {
    return json({ healthy: false, chatusage, reason: 'AI binding not configured' });
  }

  // Try a minimal inference to verify the binding is responsive
  try {
    const response = await AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    });
    // If we got here without throwing, the binding works
    return json({ healthy: true, chatusage });
  } catch (e: any) {
    return json({ healthy: false, chatusage, reason: e.message || 'AI inference failed' });
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
