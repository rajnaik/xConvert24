import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const getDB = () => (env as any).DB;

/**
 * GET /api/fav-blogs/?user_id=xxx — get all favourites for a user
 * GET /api/fav-blogs/?user_id=xxx&blog=slug — check if a specific blog is favourited
 * POST /api/fav-blogs/ — toggle favourite { user_id, blog }
 * DELETE /api/fav-blogs/ — remove favourite { user_id, blog }
 */

export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const blog = url.searchParams.get('blog');

  if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 });

  // Admin mode — get ALL favourites
  if (userId === '__admin_all__') {
    const result = await db.prepare("SELECT id, user_id, blog, datetime_created, status FROM fav_blogs ORDER BY datetime_created DESC LIMIT 500").all();
    return new Response(JSON.stringify({ favourites: result.results || [] }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (blog) {
    // Check single blog favourite status
    const row = await db.prepare("SELECT id, status FROM fav_blogs WHERE user_id = ? AND blog = ? AND status = 'active'").bind(userId, blog).first();
    return new Response(JSON.stringify({ favourited: !!row }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Get all favourites for user
  const result = await db.prepare("SELECT id, blog, datetime_created FROM fav_blogs WHERE user_id = ? AND status = 'active' ORDER BY datetime_created DESC").bind(userId).all();
  return new Response(JSON.stringify({ favourites: result.results || [] }), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json();
  const { user_id, blog } = body as any;

  if (!user_id || !blog) return new Response(JSON.stringify({ error: 'user_id and blog required' }), { status: 400 });

  // Check if already exists
  const existing = await db.prepare("SELECT id, status FROM fav_blogs WHERE user_id = ? AND blog = ?").bind(user_id, blog).first();

  if (existing) {
    // Toggle status
    const newStatus = (existing as any).status === 'active' ? 'removed' : 'active';
    await db.prepare("UPDATE fav_blogs SET status = ?, datetime_created = datetime('now') WHERE id = ?").bind(newStatus, (existing as any).id).run();
    return new Response(JSON.stringify({ favourited: newStatus === 'active', action: newStatus === 'active' ? 'added' : 'removed' }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Insert new
  await db.prepare("INSERT INTO fav_blogs (user_id, blog) VALUES (?, ?)").bind(user_id, blog).run();
  return new Response(JSON.stringify({ favourited: true, action: 'added' }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const body = await request.json();
  const { user_id, blog } = body as any;

  if (!user_id || !blog) return new Response(JSON.stringify({ error: 'user_id and blog required' }), { status: 400 });

  await db.prepare("UPDATE fav_blogs SET status = 'removed' WHERE user_id = ? AND blog = ?").bind(user_id, blog).run();
  return new Response(JSON.stringify({ favourited: false, action: 'removed' }), { headers: { 'Content-Type': 'application/json' } });
};
