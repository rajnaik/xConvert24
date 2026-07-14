import type { APIRoute } from 'astro';
import { getDB, jsonError, jsonOk } from '../../lib/db';

// GET /api/roadmap-features — public (status=1 only) or ?all=true for admin
export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB not available');

  const url = new URL(request.url);
  const showAll = url.searchParams.get('all') === 'true';

  const query = showAll
    ? 'SELECT * FROM roadmap_features ORDER BY sort_order ASC'
    : 'SELECT id, name, description, category, progress, icon, sort_order, delivered_version, feature_url FROM roadmap_features WHERE status = 1 ORDER BY sort_order ASC';

  const result = await db.prepare(query).all();
  return jsonOk({ features: result.results });
};

// POST /api/roadmap-features — create a feature
export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB not available');

  const body = await request.json() as any;
  const { name, description, category, status, progress, icon, sort_order } = body;

  if (!name) return jsonError('name required', 400);

  const result = await db.prepare(
    'INSERT INTO roadmap_features (name, description, category, status, progress, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    name,
    description || '',
    category || 'feature',
    status ?? 1,
    progress || 'planned',
    icon || '🚀',
    sort_order || 0
  ).run();

  return jsonOk({ success: true, id: result.meta.last_row_id });
};

// PUT /api/roadmap-features — update a feature
export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB not available');

  const body = await request.json() as any;
  const { id, name, description, category, status, progress, icon, sort_order } = body;

  if (!id) return jsonError('id required', 400);

  await db.prepare(
    `UPDATE roadmap_features SET 
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      status = COALESCE(?, status),
      progress = COALESCE(?, progress),
      icon = COALESCE(?, icon),
      sort_order = COALESCE(?, sort_order),
      updated_at = datetime('now')
    WHERE id = ?`
  ).bind(
    name || null, description || null, category || null,
    status ?? null, progress || null, icon || null, sort_order ?? null, id
  ).run();

  return jsonOk({ success: true });
};

// DELETE /api/roadmap-features?id=X
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB not available');

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonError('id required', 400);

  await db.prepare('DELETE FROM roadmap_features WHERE id = ?').bind(parseInt(id)).run();
  return jsonOk({ success: true });
};
