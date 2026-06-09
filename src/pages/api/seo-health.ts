import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  try {
    const db = (env as any).BUGS_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const row = await db.prepare('SELECT environment, report, status, created_at FROM seo_health ORDER BY id DESC LIMIT 1').first();
    return new Response(JSON.stringify({ health: row || null }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * POST /api/seo-health — Save a new SEO health check report
 * Body: { environment: string, report: string, status: "pass"|"fail" }
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = (env as any).BUGS_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json() as any;
    const { environment, report, status } = body;

    if (!environment || !status) {
      return new Response(JSON.stringify({ error: 'environment and status are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    await db.prepare('INSERT INTO seo_health (environment, report, status) VALUES (?, ?, ?)')
      .bind(environment, report || '', status)
      .run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
