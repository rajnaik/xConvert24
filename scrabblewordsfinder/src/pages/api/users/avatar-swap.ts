import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { generateDisplayName, TOTAL_AVATARS, getAnimalName } from '../../../lib/avatar-names';

export const prerender = false;

const getDB = () => (env as any).DB;

/**
 * GET /api/users/avatar-swap/ — List all available avatars with names
 * Query: ?page=1 (1-indexed, 10 per page)
 * Returns: { avatars: [{ id, name, src }], total, page, pages }
 */
export const GET: APIRoute = async ({ url }) => {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = 10;
  const total = TOTAL_AVATARS;
  const pages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;

  const avatars = [];
  for (let i = offset + 1; i <= Math.min(offset + perPage, total); i++) {
    avatars.push({
      id: i,
      name: getAnimalName(i),
      src: `/avatars/avatar-${i}.svg`,
    });
  }

  return new Response(JSON.stringify({ avatars, total, page, pages }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * PUT /api/users/avatar-swap/ — Save new avatar selection for a user
 * Body: { user_id, avatar_id }
 * - Updates avatar_id and regenerates display_name based on new avatar
 * - "Frees" the old avatar (no lock system — all avatars always available)
 * Returns: { success, user: { avatar_id, display_name } }
 */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const userId = body.user_id?.trim();
    const avatarId = parseInt(body.avatar_id);

    if (!userId || userId.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!avatarId || avatarId < 1 || avatarId > TOTAL_AVATARS) {
      return new Response(JSON.stringify({ error: `avatar_id must be 1-${TOTAL_AVATARS}` }), {
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

    // Check user exists
    const existing = await db.prepare(
      'SELECT user_id, avatar_id, display_name FROM users WHERE user_id = ?'
    ).bind(userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate new display name based on new avatar's animal
    const newDisplayName = generateDisplayName(avatarId);

    // Update user record (old avatar is "freed" — no lock table needed)
    await db.prepare(
      'UPDATE users SET avatar_id = ?, display_name = ? WHERE user_id = ?'
    ).bind(avatarId, newDisplayName, userId).run();

    return new Response(JSON.stringify({
      success: true,
      user: {
        avatar_id: avatarId,
        display_name: newDisplayName,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Avatar swap failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
