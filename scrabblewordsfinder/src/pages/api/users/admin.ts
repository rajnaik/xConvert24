import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { generateDisplayName, TOTAL_AVATARS } from '../../../lib/avatar-names';

export const prerender = false;

const getDB = () => (env as any).DB;

/**
 * GET /api/users/admin/ — List all users with avatar info for admin CRUD
 * Returns: { users: [...], total: number }
 */
export const GET: APIRoute = async ({ url }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';

    let query = `SELECT * FROM users`;
    let countQuery = `SELECT COUNT(*) as total FROM users`;
    const binds: any[] = [];
    const countBinds: any[] = [];

    const avatarIdFilter = url.searchParams.get('avatar_id');

    if (avatarIdFilter) {
      const where = ` WHERE avatar_id = ?`;
      query += where;
      countQuery += where;
      binds.push(parseInt(avatarIdFilter));
      countBinds.push(parseInt(avatarIdFilter));
    } else if (search) {
      const where = ` WHERE display_name LIKE ? OR user_id LIKE ? OR city LIKE ? OR country LIKE ?`;
      const searchPattern = `%${search}%`;
      query += where;
      countQuery += where;
      binds.push(searchPattern, searchPattern, searchPattern, searchPattern);
      countBinds.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    binds.push(limit, offset);

    const [usersResult, countResult] = await Promise.all([
      db.prepare(query).bind(...binds).all(),
      db.prepare(countQuery).bind(...countBinds).first(),
    ]);

    // Avatar usage counts
    const avatarUsage = await db.prepare('SELECT avatar_id, COUNT(*) as count FROM users GROUP BY avatar_id ORDER BY avatar_id').all();

    return new Response(JSON.stringify({
      users: usersResult.results || [],
      total: countResult?.total || 0,
      avatar_usage: avatarUsage.results || [],
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * PUT /api/users/admin/ — Update a user's display_name or avatar_id
 * Body: { user_id, display_name?, avatar_id?, message? }
 */
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json();
    const userId = body.user_id;
    if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const updates: string[] = [];
    const values: any[] = [];

    if (body.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(body.display_name);
    }
    if (body.avatar_id !== undefined) {
      const avatarId = parseInt(body.avatar_id);
      if (avatarId < 1 || avatarId > TOTAL_AVATARS) {
        return new Response(JSON.stringify({ error: `avatar_id must be 1-${TOTAL_AVATARS}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      updates.push('avatar_id = ?');
      values.push(avatarId);
    }
    if (body.message !== undefined) {
      updates.push('message = ?');
      values.push((body.message || '').substring(0, 1000));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    values.push(userId);
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`).bind(...values).run();

    // Return updated user
    const updated = await db.prepare('SELECT user_id, display_name, avatar_id, message, visit_count, last_seen, created_at FROM users WHERE user_id = ?').bind(userId).first();

    return new Response(JSON.stringify({ success: true, user: updated }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * DELETE /api/users/admin/ — Delete a user
 * Body: { user_id }
 */
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json();
    const userId = body.user_id;
    if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    await db.prepare('DELETE FROM users WHERE user_id = ?').bind(userId).run();

    return new Response(JSON.stringify({ success: true, deleted: userId }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

/**
 * POST /api/users/admin/ — Regenerate display name for a user (randomize)
 * Body: { user_id, action: 'regenerate_name' }
 */
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return new Response(JSON.stringify({ error: 'DB unavailable' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json();
    const userId = body.user_id;
    const action = body.action;

    if (!userId) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    if (action === 'regenerate_name') {
      const user = await db.prepare('SELECT avatar_id FROM users WHERE user_id = ?').bind(userId).first();
      if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });

      const newName = generateDisplayName(user.avatar_id as number);
      await db.prepare('UPDATE users SET display_name = ? WHERE user_id = ?').bind(newName, userId).run();

      return new Response(JSON.stringify({ success: true, display_name: newName }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'randomize_avatar') {
      const newAvatarId = Math.floor(Math.random() * TOTAL_AVATARS) + 1;
      const newName = generateDisplayName(newAvatarId);
      await db.prepare('UPDATE users SET avatar_id = ?, display_name = ? WHERE user_id = ?').bind(newAvatarId, newName, userId).run();

      return new Response(JSON.stringify({ success: true, avatar_id: newAvatarId, display_name: newName }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
