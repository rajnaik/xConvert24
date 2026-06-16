import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Quill's daily publisher — Auto-publishes blog posts whose pub_date has arrived.
 * Triggered daily at 21:00 UTC via Cron or manually via GET request.
 * 
 * Logic: UPDATE BlogPosts SET status = 1 WHERE pub_date <= date('now') AND status = 0
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'BUGS_DB not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Publish all posts whose date has arrived
    const result = await db.prepare(
      "UPDATE BlogPosts SET status = 1 WHERE pub_date <= date('now') AND status = 0"
    ).run();

    const published = result.meta?.changes || 0;

    // Also get current stats
    const stats = await db.prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as published, SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as drafts FROM BlogPosts"
    ).first();

    return new Response(JSON.stringify({
      success: true,
      agent: 'Quill',
      action: 'publish-blogs',
      timestamp: new Date().toISOString(),
      newlyPublished: published,
      stats: {
        total: stats?.total || 0,
        published: stats?.published || 0,
        drafts: stats?.drafts || 0,
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
