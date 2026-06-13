import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime.env.BUGS_DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const table = url.searchParams.get('table');

  // List all tables
  if (!table) {
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf%' AND name != 'sqlite_sequence' AND name != 'd1_migrations' ORDER BY name").all();
    return new Response(JSON.stringify({ tables: results.map((r: any) => r.name) }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Get table data
  const limit = url.searchParams.get('limit') || '100';
  const { results } = await db.prepare(`SELECT * FROM "${table}" ORDER BY rowid DESC LIMIT ?`).bind(Number(limit)).all();

  // Get column info
  const { results: cols } = await db.prepare(`PRAGMA table_info("${table}")`).all();

  return new Response(JSON.stringify({ table, columns: cols, rows: results, count: results.length }), { headers: { 'Content-Type': 'application/json' } });
};

export const DELETE: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime.env.BUGS_DB;
  const table = url.searchParams.get('table');
  const id = url.searchParams.get('id');
  const idCol = url.searchParams.get('idCol') || 'id';

  if (!table || !id) return new Response(JSON.stringify({ error: 'table and id required' }), { status: 400 });

  await db.prepare(`DELETE FROM "${table}" WHERE "${idCol}" = ?`).bind(id).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
};
