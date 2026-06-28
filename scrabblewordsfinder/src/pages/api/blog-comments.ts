import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * GET /api/blog-comments/?blogid=<slug>
 * Returns approved, non-hidden comments for a given blog post, ordered by datetime.
 * Client builds the tree using the `related` field.
 *
 * Admin modes:
 *   ?admin=true               → returns ALL comments (all statuses) with counts
 *   ?admin=true&hidden=true   → returns ONLY hidden comments
 *   ?admin=true&stats=true    → returns only stats (approved, pending, hidden, total counts)
 */
export const GET: APIRoute = async ({ url }) => {
  const blogid = url.searchParams.get('blogid');
  const admin = url.searchParams.get('admin') === 'true';
  const statsOnly = url.searchParams.get('stats') === 'true';
  const hiddenOnly = url.searchParams.get('hidden') === 'true';

  const db = (env as any).DB;
  if (!db) {
    return json({ error: 'Service unavailable' }, 503);
  }

  try {
    // Stats mode — return counts only
    if (admin && statsOnly) {
      const { results } = await db.prepare(
        `SELECT status, COUNT(*) as count FROM Blog_Comments WHERE hidden = 0 GROUP BY status`
      ).all();
      const stats: Record<string, number> = { approved: 0, pending: 0, hidden: 0, total: 0 };
      for (const row of (results || [])) {
        stats[row.status as string] = row.count as number;
        stats.total += row.count as number;
      }
      // Get hidden count separately
      const { results: hiddenRows } = await db.prepare(
        `SELECT COUNT(*) as count FROM Blog_Comments WHERE hidden = 1`
      ).all();
      stats.hidden = (hiddenRows && hiddenRows[0]) ? (hiddenRows[0].count as number) : 0;
      stats.total += stats.hidden;
      return json({ stats });
    }

    // Admin mode — hidden filter: return only hidden comments
    if (admin && hiddenOnly) {
      const { results } = await db.prepare(
        `SELECT id, blogid, blogname, subject, comment, commenterName, datetime, dateedited, status, editedstatus, related, hidden
         FROM Blog_Comments
         WHERE hidden = 1
         ORDER BY datetime DESC
         LIMIT 500`
      ).all();
      return json({ comments: results || [] });
    }

    // Admin mode — return all non-hidden comments regardless of status
    if (admin) {
      const { results } = await db.prepare(
        `SELECT id, blogid, blogname, subject, comment, commenterName, datetime, dateedited, status, editedstatus, related, hidden
         FROM Blog_Comments
         WHERE hidden = 0
         ORDER BY datetime DESC
         LIMIT 500`
      ).all();
      // Also include stats
      const { results: statRows } = await db.prepare(
        `SELECT status, COUNT(*) as count FROM Blog_Comments WHERE hidden = 0 GROUP BY status`
      ).all();
      const stats: Record<string, number> = { approved: 0, pending: 0, hidden: 0, total: 0 };
      for (const row of (statRows || [])) {
        stats[row.status as string] = row.count as number;
        stats.total += row.count as number;
      }
      const { results: hiddenRows } = await db.prepare(
        `SELECT COUNT(*) as count FROM Blog_Comments WHERE hidden = 1`
      ).all();
      stats.hidden = (hiddenRows && hiddenRows[0]) ? (hiddenRows[0].count as number) : 0;
      return json({ comments: results || [], stats });
    }

    // Public mode — requires blogid, returns approved + non-hidden only
    // Also supports ?mine=1,2,3 — returns the user's own pending comments by ID
    if (!blogid) {
      return json({ error: 'blogid parameter is required' }, 400);
    }

    const { results } = await db.prepare(
      `SELECT id, blogid, blogname, subject, comment, commenterName, datetime, dateedited, status, editedstatus, related
       FROM Blog_Comments
       WHERE blogid = ? AND status = 'approved' AND hidden = 0
       ORDER BY datetime ASC`
    ).bind(blogid).all();

    // Fetch user's own pending comments by ID (ownership tracked client-side)
    const mineParam = url.searchParams.get('mine');
    let pendingMine: any[] = [];
    if (mineParam) {
      const ids = mineParam.split(',').map(Number).filter(n => n > 0 && Number.isInteger(n)).slice(0, 50);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        const { results: mineResults } = await db.prepare(
          `SELECT id, blogid, blogname, subject, comment, commenterName, datetime, dateedited, status, editedstatus, related
           FROM Blog_Comments
           WHERE blogid = ? AND id IN (${placeholders}) AND status = 'pending' AND hidden = 0
           ORDER BY datetime ASC`
        ).bind(blogid, ...ids).all();
        pendingMine = mineResults || [];
      }
    }

    // Merge: approved comments + user's pending (deduplicated)
    const approvedIds = new Set((results || []).map((c: any) => c.id));
    const allComments = [...(results || [])];
    for (const c of pendingMine) {
      if (!approvedIds.has(c.id)) allComments.push(c);
    }
    // Re-sort by datetime
    allComments.sort((a: any, b: any) => (a.datetime || '').localeCompare(b.datetime || ''));

    return json({ comments: allComments });
  } catch (e: any) {
    return json({ error: e.message || 'Failed to fetch comments' }, 500);
  }
};

/**
 * PATCH /api/blog-comments/
 * Admin: update comment status or hidden flag.
 *   Body: { id, status } where status is 'approved' or 'pending'
 *   Body: { id, hidden } where hidden is 0 or 1 (toggle visibility)
 *   Both can be sent together: { id, status, hidden }
 */
export const PATCH: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { id, status, hidden } = body;

  if (!id) {
    return json({ error: 'id is required' }, 400);
  }

  // Must provide at least one of status or hidden
  const hasStatus = status !== undefined;
  const hasHidden = hidden !== undefined;

  if (!hasStatus && !hasHidden) {
    return json({ error: 'id and status (approved|pending) are required' }, 400);
  }

  if (hasStatus && !['approved', 'pending'].includes(status)) {
    return json({ error: 'id and status (approved|pending) are required' }, 400);
  }

  if (hasHidden && ![0, 1].includes(Number(hidden))) {
    return json({ error: 'hidden must be 0 or 1' }, 400);
  }

  const db = (env as any).DB;
  if (!db) return json({ error: 'Service unavailable' }, 503);

  try {
    // Build dynamic update
    if (hasStatus && hasHidden) {
      await db.prepare(`UPDATE Blog_Comments SET status = ?, hidden = ? WHERE id = ?`).bind(status, Number(hidden), id).run();
    } else if (hasStatus) {
      await db.prepare(`UPDATE Blog_Comments SET status = ? WHERE id = ?`).bind(status, id).run();
    } else {
      await db.prepare(`UPDATE Blog_Comments SET hidden = ? WHERE id = ?`).bind(Number(hidden), id).run();
    }

    const result: any = { ok: true, id };
    if (hasStatus) result.status = status;
    if (hasHidden) result.hidden = Number(hidden);
    return json(result);
  } catch (e: any) {
    return json({ error: e.message || 'Failed to update comment' }, 500);
  }
};

/**
 * PUT /api/blog-comments/
 * Edit own pending comment. Body: { id, comment, subject? }
 * Only works on comments with status='pending' (ownership enforced client-side via localStorage).
 * Sets editedstatus='edited' and dateedited to current datetime.
 */
export const PUT: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { id, comment, subject } = body;

  if (!id || !comment || !comment.trim()) {
    return json({ error: 'id and comment are required' }, 400);
  }

  const db = (env as any).DB;
  if (!db) return json({ error: 'Service unavailable' }, 503);

  const trimmedComment = comment.trim().slice(0, 2000);
  const trimmedSubject = (subject !== undefined) ? (subject || '').trim().slice(0, 200) : undefined;

  try {
    // Only allow editing pending comments
    const { results } = await db.prepare(
      `SELECT id, status FROM Blog_Comments WHERE id = ?`
    ).bind(id).all();

    if (!results || results.length === 0) {
      return json({ error: 'Comment not found' }, 404);
    }
    if (results[0].status !== 'pending') {
      return json({ error: 'Only pending comments can be edited' }, 403);
    }

    // Update the comment
    if (trimmedSubject !== undefined) {
      await db.prepare(
        `UPDATE Blog_Comments SET comment = ?, subject = ?, editedstatus = 'edited', dateedited = datetime('now') WHERE id = ? AND status = 'pending'`
      ).bind(trimmedComment, trimmedSubject, id).run();
    } else {
      await db.prepare(
        `UPDATE Blog_Comments SET comment = ?, editedstatus = 'edited', dateedited = datetime('now') WHERE id = ? AND status = 'pending'`
      ).bind(trimmedComment, id).run();
    }

    return json({ ok: true, id });
  } catch (e: any) {
    return json({ error: e.message || 'Failed to edit comment' }, 500);
  }
};

/**
 * POST /api/blog-comments/
 * Submit a new comment. Fields: blogid, blogname, subject, comment, commenterName, related (optional).
 * New comments default to status='pending' (require admin approval).
 */
export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { blogid, blogname, subject, comment, commenterName, related } = body;

  if (!blogid || !comment || !comment.trim()) {
    return json({ error: 'blogid and comment are required' }, 400);
  }

  if (!commenterName || !commenterName.trim()) {
    return json({ error: 'Name is required' }, 400);
  }

  const db = (env as any).DB;
  if (!db) {
    return json({ error: 'Service unavailable' }, 503);
  }

  const trimmedComment = comment.trim().slice(0, 2000);
  const trimmedName = commenterName.trim().slice(0, 100);
  const trimmedSubject = (subject || '').trim().slice(0, 200);
  const parentId = related && Number.isInteger(Number(related)) ? Number(related) : null;

  try {
    const result = await db.prepare(
      `INSERT INTO Blog_Comments (blogid, blogname, subject, comment, commenterName, related)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      blogid,
      blogname || '',
      trimmedSubject,
      trimmedComment,
      trimmedName,
      parentId
    ).run();

    return json({ ok: true, id: result.meta?.last_row_id ?? null });
  } catch (e: any) {
    return json({ error: e.message || 'Failed to save comment' }, 500);
  }
};
