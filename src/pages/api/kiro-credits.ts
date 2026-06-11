import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/kiro-credits — Get latest Kiro credit usage (or last N entries with ?limit=)
 * POST /api/kiro-credits — Store a new credit usage reading
 *   Body: { plan, credits_used, credits_total, credits_remaining, percentage_used, reset_date?, raw_text? }
 */

export const GET: APIRoute = async ({ url }) => {
  try {
    const db = (env as any).BUGS_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1') || 1, 30);

    const { results } = await db
      .prepare('SELECT id, plan, credits_used, credits_total, credits_remaining, percentage_used, reset_date, scraped_at FROM kiro_credits ORDER BY scraped_at DESC LIMIT ?')
      .bind(limit)
      .all();

    // If limit=1, return single object for convenience
    if (limit === 1 && results.length > 0) {
      return new Response(JSON.stringify(results[0]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ credits: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
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

    const {
      plan = 'unknown',
      credits_used = 0,
      credits_total = 0,
      credits_remaining = 0,
      percentage_used = 0,
      reset_date = '',
      raw_text = '',
    } = body;

    await db
      .prepare(
        'INSERT INTO kiro_credits (plan, credits_used, credits_total, credits_remaining, percentage_used, reset_date, raw_text) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(plan, credits_used, credits_total, credits_remaining, percentage_used, reset_date || '', (raw_text || '').slice(0, 2000))
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
