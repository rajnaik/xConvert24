import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/geo-enrich — Admin-triggered geo-enrichment
 * Enriches up to 50 un-enriched ClicksAnalysis rows with geo data from ip-api.com
 *
 * Steps:
 * 1. Fetch up to 50 rows where latitude IS NULL and ip_address != ''
 * 2. Filter out private/reserved IPs
 * 3. Batch lookup remaining IPs via POST http://ip-api.com/batch
 * 4. Update each successfully resolved row with latitude, longitude, city, country
 * 5. Return summary { enriched, skipped, failed }
 */
export const POST: APIRoute = async () => {
  const db = (env as any).DB;

  if (!db) {
    return json({ error: 'Database binding unavailable' }, 503);
  }

  // 1. Fetch up to 50 un-enriched rows
  let rows: any[];
  try {
    const result = await db.prepare(
      `SELECT id, ip_address FROM ClicksAnalysis
       WHERE latitude IS NULL AND ip_address != ''
       LIMIT 50`
    ).all();
    rows = result.results || [];
  } catch (e: any) {
    return json({ error: e.message || 'Failed to query ClicksAnalysis' }, 500);
  }

  if (rows.length === 0) {
    return json({ enriched: 0, skipped: 0, failed: 0, message: 'All IPs already enriched' });
  }

  // 2. Filter out private/reserved IPs
  const publicRows = rows.filter(r => !isPrivateIP(r.ip_address));
  const skipped = rows.length - publicRows.length;

  if (publicRows.length === 0) {
    return json({ enriched: 0, skipped, failed: 0 });
  }

  // 3. Batch lookup via ip-api.com
  const ips = publicRows.map(r => r.ip_address);
  let geoResults: GeoIPResponse[];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://ip-api.com/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ips),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return json({
        error: `ip-api.com returned ${response.status}`,
        unprocessed: publicRows.length,
      }, 502);
    }

    geoResults = await response.json() as GeoIPResponse[];
  } catch (e: any) {
    const errorMsg = e.name === 'AbortError'
      ? 'Batch request timed out (5s)'
      : (e.message || 'Batch request failed');
    return json({ error: errorMsg, unprocessed: publicRows.length }, 502);
  }

  // 4. Update each successfully resolved row
  let enriched = 0;
  let failed = 0;

  // Build a lookup map from IP -> geo result
  const geoMap = new Map<string, GeoIPResponse>();
  for (const result of geoResults) {
    geoMap.set(result.query, result);
  }

  for (const row of publicRows) {
    const geo = geoMap.get(row.ip_address);

    if (!geo || geo.status === 'fail') {
      failed++;
      continue;
    }

    try {
      await db.prepare(
        `UPDATE ClicksAnalysis
         SET latitude = ?, longitude = ?, city = ?, country = ?
         WHERE id = ?`
      ).bind(geo.lat, geo.lon, geo.city || '', geo.country || '', row.id).run();
      enriched++;
    } catch {
      failed++;
    }
  }

  return json({ enriched, skipped, failed });
};

/**
 * Detects private/reserved IP addresses that cannot be geo-resolved.
 * Matches: 127.x.x.x, 10.x.x.x, 192.168.x.x, 172.16-31.x.x
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return true;

  const parts = ip.split('.');
  if (parts.length !== 4) return true;

  const [a, b] = parts.map(Number);

  // 127.x.x.x — loopback
  if (a === 127) return true;

  // 10.x.x.x — private class A
  if (a === 10) return true;

  // 192.168.x.x — private class C
  if (a === 192 && b === 168) return true;

  // 172.16.x.x through 172.31.x.x — private class B
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

interface GeoIPResponse {
  status: 'success' | 'fail';
  query: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  message?: string;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
