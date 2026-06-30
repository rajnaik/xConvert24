import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Badges Admin API — Full CRUD for badge tiers
 *
 * GET    /api/badges/          — list all badges + stats
 * POST   /api/badges/          — create a new badge tier
 * PUT    /api/badges/          — update an existing badge
 * DELETE /api/badges/          — delete a badge by id
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const statsOnly = url.searchParams.get('stats') === 'true';

  // Get all badges ordered by threshold
  const result = await db.prepare(
    'SELECT id, name, diamonds_required, image, status, theme FROM badges ORDER BY diamonds_required ASC'
  ).all();
  const badges = result.results || [];

  // Stats
  const totalBadges = badges.length;
  const activeBadges = badges.filter((b: any) => b.status === 'active').length;
  const inactiveBadges = totalBadges - activeBadges;

  // Count how many users have earned each badge (users with total diamonds >= threshold)
  let badgeEarners: any[] = [];
  if (!statsOnly) {
    const earnersResult = await db.prepare(`
      SELECT b.id as badge_id, COUNT(ur.user_id) as earners
      FROM badges b
      LEFT JOIN user_rewards ur ON ur.total_diamonds >= b.diamonds_required
      GROUP BY b.id
    `).all();
    badgeEarners = earnersResult.results || [];
  }

  // Total users with at least one badge (diamonds >= lowest threshold)
  const lowestThreshold = badges.length > 0 ? (badges[0] as any).diamonds_required : 0;
  const usersWithBadgeResult = await db.prepare(
    'SELECT COUNT(*) as count FROM user_rewards WHERE total_diamonds >= ?'
  ).bind(lowestThreshold).first() as any;
  const usersWithBadge = usersWithBadgeResult?.count || 0;

  const stats = {
    totalBadges,
    activeBadges,
    inactiveBadges,
    usersWithBadge,
  };

  if (statsOnly) {
    return new Response(JSON.stringify({ stats }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Merge earner counts into badges
  const earnerMap: Record<number, number> = {};
  for (const e of badgeEarners as any[]) {
    earnerMap[e.badge_id] = e.earners;
  }

  const enrichedBadges = badges.map((b: any) => ({
    ...b,
    earners: earnerMap[b.id] || 0,
  }));

  return new Response(JSON.stringify({ badges: enrichedBadges, stats }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { name, diamonds_required, image, status, theme } = body;

  if (!name || !diamonds_required || !image) {
    return new Response(JSON.stringify({ error: 'name, diamonds_required, and image are required' }), { status: 400 });
  }

  const result = await db.prepare(
    'INSERT INTO badges (name, diamonds_required, image, status, theme) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    name,
    Number(diamonds_required),
    image,
    status || 'active',
    theme || ''
  ).run();

  return new Response(JSON.stringify({
    success: true,
    badge: { id: result.meta?.last_row_id, name, diamonds_required: Number(diamonds_required), image, status: status || 'active', theme: theme || '' },
  }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { id, name, diamonds_required, image, status, theme } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (diamonds_required !== undefined) { fields.push('diamonds_required = ?'); values.push(Number(diamonds_required)); }
  if (image !== undefined) { fields.push('image = ?'); values.push(image); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (theme !== undefined) { fields.push('theme = ?'); values.push(theme); }

  if (fields.length === 0) {
    return new Response(JSON.stringify({ error: 'No fields to update' }), { status: 400 });
  }

  values.push(id);
  await db.prepare(`UPDATE badges SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  // Return updated badge
  const updated = await db.prepare('SELECT id, name, diamonds_required, image, status, theme FROM badges WHERE id = ?').bind(id).first();

  return new Response(JSON.stringify({ success: true, badge: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: 'id is required' }), { status: 400 });
  }

  await db.prepare('DELETE FROM badges WHERE id = ?').bind(id).run();

  return new Response(JSON.stringify({ success: true, deleted_id: id }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
