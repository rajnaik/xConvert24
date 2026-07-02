import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const getDB = () => (env as any).DB;

/**
 * POST /api/users/message-read/
 * Clears the message for a user after they've read it.
 * Body: { user_id: string }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const userId = body.user_id?.trim();

    if (!userId || userId.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDB();
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare('UPDATE users SET message = \'\' WHERE user_id = ?').bind(userId).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to clear message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
