import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/telemetry — Live site health check + saves to DB
 * GET /api/telemetry?history=true — returns last 50 checks from DB
 */

const ENDPOINTS = [
  { name: 'Homepage', path: '/' },
  { name: 'Blog', path: '/blog/' },
  { name: 'Guide', path: '/guide' },
  { name: 'API Clicks', path: '/api/clicks?count=true' },
  { name: 'API Banners', path: '/api/banners?active=true' },
  { name: 'API Site Status', path: '/api/site-status' },
  { name: 'API Emails', path: '/api/emails?limit=1' },
];

export const GET: APIRoute = async ({ url }) => {
  const db = (env as any).DB;

  // History mode — return stored telemetry data
  if (url.searchParams.get('history') === 'true') {
    if (!db) return json({ error: 'DB not configured' }, 500);
    try {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const { results } = await db.prepare(
        'SELECT * FROM telemetry ORDER BY checked_at DESC LIMIT ?'
      ).bind(limit).all();
      return json({ history: results });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }

  // Live check mode
  const baseUrl = 'https://www.scrabblewordsfinder.com';
  const results = [];
  const checkedAt = new Date().toISOString();

  for (const ep of ENDPOINTS) {
    const start = Date.now();
    try {
      const res = await fetch(`${baseUrl}${ep.path}`, { redirect: 'follow' });
      const elapsed = Date.now() - start;
      const ok = res.status >= 200 && res.status < 400;
      results.push({
        name: ep.name,
        path: ep.path,
        status: res.status,
        time_ms: elapsed,
        ok,
      });
    } catch (e: any) {
      results.push({
        name: ep.name,
        path: ep.path,
        status: 0,
        time_ms: Date.now() - start,
        ok: false,
        error: e.message,
      });
    }
  }

  const allOk = results.every(r => r.ok);
  const avgTime = Math.round(results.reduce((s, r) => s + r.time_ms, 0) / results.length);

  // Save to DB
  if (db) {
    try {
      for (const r of results) {
        await db.prepare(
          'INSERT INTO telemetry (endpoint_name, path, status_code, response_ms, healthy, checked_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(r.name, r.path, r.status, r.time_ms, r.ok ? 1 : 0, checkedAt).run();
      }
    } catch {}
  }

  return json({
    healthy: allOk,
    avg_ms: avgTime,
    checked_at: checkedAt,
    endpoints: results,
  });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
