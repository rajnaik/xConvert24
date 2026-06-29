import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * Diamond Hunt API
 *
 * GET  /api/diamond-hunt/?id=<N>&user_id=<uid>
 *   → { show, diamonds_remaining, diamonds_per_claim, already_claimed }
 *
 * POST /api/diamond-hunt/  { id, user_id }
 *   → claim a diamond from the mine, decrement remaining, credit user_rewards
 *
 * GET  /api/diamond-hunt/?all=true  (admin)
 *   → returns all diamond_hunt rows
 *
 * PUT  /api/diamond-hunt/  { id, status?, diamonds_remaining?, diamonds_per_claim?, end_date? }
 *   → admin update a row
 *
 * DELETE /api/diamond-hunt/  { id }
 *   → admin delete a row
 */

export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not available' }, 500);

  const url = new URL(request.url);

  // Admin: get all rows
  if (url.searchParams.get('all') === 'true') {
    const result = await db.prepare(
      'SELECT dh.*, (SELECT COUNT(*) FROM diamond_claims dc WHERE dc.diamond_id = dh.id) as total_claims FROM diamond_hunt dh ORDER BY dh.id'
    ).all();
    return json({ diamonds: result.results || [] });
  }

  // Public: check a specific diamond slot
  const id = url.searchParams.get('id');
  const userId = url.searchParams.get('user_id');

  if (!id) return json({ error: 'id required' }, 400);

  const row = await db.prepare(
    'SELECT id, diamonds_remaining, diamonds_per_claim, status, end_date FROM diamond_hunt WHERE id = ?'
  ).bind(Number(id)).first() as any;

  if (!row) return json({ show: false, error: 'not found' });

  const now = new Date().toISOString();
  const expired = row.end_date && row.end_date < now;
  const active = row.status === 'active' && row.diamonds_remaining > 0 && !expired;

  let alreadyClaimed = false;
  if (userId && active) {
    const claim = await db.prepare(
      'SELECT id FROM diamond_claims WHERE diamond_id = ? AND user_id = ?'
    ).bind(Number(id), userId).first();
    alreadyClaimed = !!claim;
  }

  return json({
    show: active && !alreadyClaimed,
    diamonds_remaining: row.diamonds_remaining,
    diamonds_per_claim: row.diamonds_per_claim,
    already_claimed: alreadyClaimed,
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not available' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Admin create: add a new mine
  if (body.admin_create) {
    const { id, diamonds_remaining, diamonds_per_claim, end_date, dom_loc } = body;
    if (id) {
      // Insert with explicit ID (no autoincrement)
      await db.prepare(
        'INSERT INTO diamond_hunt (id, diamonds_remaining, diamonds_per_claim, end_date, dom_loc) VALUES (?, ?, ?, ?, ?)'
      ).bind(Number(id), diamonds_remaining ?? 10, diamonds_per_claim ?? 1, end_date || null, dom_loc || '').run();
    } else {
      await db.prepare(
        'INSERT INTO diamond_hunt (diamonds_remaining, diamonds_per_claim, end_date, dom_loc) VALUES (?, ?, ?, ?)'
      ).bind(diamonds_remaining ?? 10, diamonds_per_claim ?? 1, end_date || null, dom_loc || '').run();
    }
    return json({ created: true });
  }

  const { id, user_id } = body;
  if (!id || !user_id) return json({ error: 'id and user_id required' }, 400);

  // Get the diamond row
  const row = await db.prepare(
    'SELECT id, diamonds_remaining, diamonds_per_claim, status, end_date FROM diamond_hunt WHERE id = ?'
  ).bind(Number(id)).first() as any;

  if (!row) return json({ error: 'Diamond not found' }, 404);

  const now = new Date().toISOString();
  const expired = row.end_date && row.end_date < now;

  if (row.status !== 'active') return json({ error: 'Diamond inactive' }, 400);
  if (row.diamonds_remaining <= 0) return json({ error: 'No diamonds remaining — mine depleted' }, 400);
  if (expired) return json({ error: 'Diamond expired' }, 400);

  // Check if user already claimed
  const existing = await db.prepare(
    'SELECT id FROM diamond_claims WHERE diamond_id = ? AND user_id = ?'
  ).bind(Number(id), user_id).first();

  if (existing) {
    return json({ claimed: false, already_claimed: true, message: 'You already claimed this diamond' });
  }

  // Check if user_rewards row exists (needed to decide INSERT vs UPDATE)
  const rewards = await db.prepare(
    'SELECT id FROM user_rewards WHERE user_id = ?'
  ).bind(user_id).first();

  // Atomic transaction: all claim operations succeed or fail together
  const rewardStmt = rewards
    ? db.prepare(
        "UPDATE user_rewards SET total_diamonds = total_diamonds + ?, updated_at = datetime('now') WHERE user_id = ?"
      ).bind(row.diamonds_per_claim, user_id)
    : db.prepare(
        "INSERT INTO user_rewards (user_id, total_stars, total_diamonds, current_streak, best_streak, diamond_streak, best_diamond_streak, last_active_date, last_diamond_date) VALUES (?, 0, ?, 0, 0, 0, 0, ?, ?)"
      ).bind(user_id, row.diamonds_per_claim, now.split('T')[0], now.split('T')[0]);

  await db.batch([
    db.prepare(
      'UPDATE diamond_hunt SET diamonds_remaining = diamonds_remaining - 1 WHERE id = ? AND diamonds_remaining > 0'
    ).bind(Number(id)),
    db.prepare(
      'INSERT INTO diamond_claims (diamond_id, user_id, diamonds_earned) VALUES (?, ?, ?)'
    ).bind(Number(id), user_id, row.diamonds_per_claim),
    rewardStmt,
  ]);

  // Get user's updated total diamonds and compute badge progress
  const updatedRewards = await db.prepare(
    'SELECT total_diamonds FROM user_rewards WHERE user_id = ?'
  ).bind(user_id).first() as any;
  const totalDiamonds = updatedRewards?.total_diamonds || row.diamonds_per_claim;

  // Find the next badge the user hasn't reached yet
  const nextBadge = await db.prepare(
    "SELECT name, diamonds_required, image FROM badges WHERE diamonds_required > ? AND status = 'active' ORDER BY diamonds_required ASC LIMIT 1"
  ).bind(totalDiamonds).first() as any;

  // Find the current badge the user has achieved
  const currentBadge = await db.prepare(
    "SELECT name, diamonds_required, image FROM badges WHERE diamonds_required <= ? AND status = 'active' ORDER BY diamonds_required DESC LIMIT 1"
  ).bind(totalDiamonds).first() as any;

  const badgeProgress: any = { total_diamonds: totalDiamonds };
  if (currentBadge) {
    badgeProgress.current_badge = currentBadge.name;
    badgeProgress.current_badge_image = currentBadge.image;
  }
  if (nextBadge) {
    badgeProgress.next_badge = nextBadge.name;
    badgeProgress.next_badge_image = nextBadge.image;
    badgeProgress.diamonds_needed = nextBadge.diamonds_required - totalDiamonds;
    badgeProgress.next_badge_threshold = nextBadge.diamonds_required;
  } else {
    badgeProgress.max_badge_reached = true;
  }

  return json({
    claimed: true,
    diamonds_earned: row.diamonds_per_claim,
    diamonds_remaining: row.diamonds_remaining - 1,
    message: `💎 You mined ${row.diamonds_per_claim} diamond${row.diamonds_per_claim > 1 ? 's' : ''}!`,
    badge_progress: badgeProgress,
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not available' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { id, new_id, status, diamonds_remaining, diamonds_per_claim, end_date, dom_loc } = body;
  if (!id) return json({ error: 'id required' }, 400);

  const updates: string[] = [];
  const values: any[] = [];

  if (new_id !== undefined && new_id !== id) { updates.push('id = ?'); values.push(Number(new_id)); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (diamonds_remaining !== undefined) { updates.push('diamonds_remaining = ?'); values.push(diamonds_remaining); }
  if (diamonds_per_claim !== undefined) { updates.push('diamonds_per_claim = ?'); values.push(diamonds_per_claim); }
  if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date || null); }
  if (dom_loc !== undefined) { updates.push('dom_loc = ?'); values.push(dom_loc); }

  if (updates.length === 0) return json({ error: 'No fields to update' }, 400);

  values.push(Number(id));
  await db.prepare(
    `UPDATE diamond_hunt SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  // If ID changed, also update diamond_claims references
  if (new_id !== undefined && new_id !== id) {
    await db.prepare(
      'UPDATE diamond_claims SET diamond_id = ? WHERE diamond_id = ?'
    ).bind(Number(new_id), Number(id)).run();
  }

  return json({ updated: true, id: new_id || id });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return json({ error: 'DB not available' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { id } = body;
  if (!id) return json({ error: 'id required' }, 400);

  await db.prepare('DELETE FROM diamond_claims WHERE diamond_id = ?').bind(Number(id)).run();
  await db.prepare('DELETE FROM diamond_hunt WHERE id = ?').bind(Number(id)).run();

  return json({ deleted: true, id });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
