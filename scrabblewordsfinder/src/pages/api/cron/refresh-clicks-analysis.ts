import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/cron/refresh-clicks-analysis
 *
 * Aggregates raw clicks → ClicksAnalysis table.
 * Groups by ip_address, counts total clicks, and records the latest timestamp.
 * Preserves existing geo data (latitude, longitude, city, country) if already present.
 *
 * Can be triggered manually or via external cron.
 */
export const GET: APIRoute = async () => {
  try {
    const db = (env as any).DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'DB not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Aggregate clicks by ip_address (excluding empty IPs)
    const { results: aggregated } = await db.prepare(`
      SELECT ip_address, COUNT(*) as click_count, MAX(created_at) as last_seen
      FROM clicks
      WHERE ip_address IS NOT NULL AND ip_address != ''
      GROUP BY ip_address
    `).all();

    if (!aggregated || aggregated.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No clicks with IP addresses to aggregate',
        updated: 0,
        inserted: 0,
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    let updated = 0;
    let inserted = 0;

    // Upsert each aggregated row — preserve existing geo data
    for (const row of aggregated) {
      const existing = await db.prepare(
        'SELECT id FROM ClicksAnalysis WHERE ip_address = ?'
      ).bind(row.ip_address).first();

      if (existing) {
        await db.prepare(
          'UPDATE ClicksAnalysis SET click_count = ?, last_seen = ? WHERE ip_address = ?'
        ).bind(row.click_count, row.last_seen, row.ip_address).run();
        updated++;
      } else {
        await db.prepare(
          'INSERT INTO ClicksAnalysis (ip_address, click_count, last_seen) VALUES (?, ?, ?)'
        ).bind(row.ip_address, row.click_count, row.last_seen).run();
        inserted++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      totalIPs: aggregated.length,
      updated,
      inserted,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
