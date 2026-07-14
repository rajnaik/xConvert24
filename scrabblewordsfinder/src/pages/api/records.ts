import type { APIRoute } from 'astro';
import { getDB, jsonError, jsonOk } from '../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB unavailable', 503);

  const body = await request.json() as any;
  const { record_name, record_value, category, holder_name, holder_country, achieved_date, source, notes } = body;

  if (!record_name || !record_value) return jsonError('record_name and record_value required', 400);

  await db.prepare(
    'INSERT INTO scrabble_records (category, record_name, record_value, holder_name, holder_country, achieved_date, source, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(category || 'rating', record_name, record_value, holder_name || '', holder_country || '', achieved_date || '', source || '', notes || '').run();

  return jsonOk({ success: true });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB unavailable', 503);

  const body = await request.json() as any;
  const { id, record_name, record_value, category, holder_name, holder_country, achieved_date, source, notes } = body;

  if (!id) return jsonError('id required', 400);

  await db.prepare(
    `UPDATE scrabble_records SET 
      record_name = ?,
      record_value = ?,
      category = ?,
      holder_name = ?,
      holder_country = ?,
      achieved_date = ?,
      source = ?,
      notes = ?
    WHERE id = ?`
  ).bind(record_name, record_value, category, holder_name || '', holder_country || '', achieved_date || '', source || '', notes || '', id).run();

  return jsonOk({ success: true });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = getDB();
  if (!db) return jsonError('DB unavailable', 503);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return jsonError('id required', 400);

  await db.prepare('DELETE FROM scrabble_records WHERE id = ?').bind(parseInt(id)).run();
  return jsonOk({ success: true });
};
