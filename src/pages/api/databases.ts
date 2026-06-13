import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = (locals as any).runtime.env.BUGS_DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const table = url.searchParams.get('table');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);

  if (table) {
    // Return rows from specific table
    try {
      const { results } = await db.prepare(`SELECT * FROM "${table}" ORDER BY rowid DESC LIMIT ?`).bind(limit).all();
      return new Response(JSON.stringify({ table, rows: results }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // List all tables with row counts
  try {
    const { results: tableList } = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf%' AND name != 'sqlite_sequence' AND name != 'd1_migrations' ORDER BY name").all();

    const tables = [];
    for (const t of tableList as any[]) {
      try {
        const countRow = await db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).first();
        tables.push({ name: t.name, count: countRow?.count || 0 });
      } catch {
        tables.push({ name: t.name, count: '?' });
      }
    }

    return new Response(JSON.stringify({ tables }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
