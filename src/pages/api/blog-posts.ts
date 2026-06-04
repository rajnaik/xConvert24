import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/blog-posts — list all blog posts
 * POST /api/blog-posts — update a blog post status/pub_date
 *   Body: { blogid: string, status?: 0|1, pub_date?: string }
 */

export const GET: APIRoute = async () => {
  const db = (env as any).BLOGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Blogs database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { results } = await db.prepare(
    'SELECT blogid, topic, description, pub_date, create_date, status FROM BlogPosts ORDER BY pub_date ASC'
  ).all();

  return new Response(JSON.stringify({ posts: results }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).BLOGS_DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'Blogs database not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const { blogid, status, pub_date } = body;
  if (!blogid) {
    return new Response(JSON.stringify({ error: 'blogid is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update status and/or pub_date
  if (status !== undefined && pub_date !== undefined) {
    await db.prepare('UPDATE BlogPosts SET status = ?, pub_date = ? WHERE blogid = ?')
      .bind(status, pub_date, blogid).run();
  } else if (status !== undefined) {
    await db.prepare('UPDATE BlogPosts SET status = ? WHERE blogid = ?')
      .bind(status, blogid).run();
  } else if (pub_date !== undefined) {
    await db.prepare('UPDATE BlogPosts SET pub_date = ? WHERE blogid = ?')
      .bind(pub_date, blogid).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
