import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const ENDPOINTS = [
  { name: 'Homepage', path: '/' },
  { name: 'Coins Tracker', path: '/coins' },
  { name: 'Blog Index', path: '/blog' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'API Coins', path: '/api/coins' },
  { name: 'API Clicks', path: '/api/clicks?count=true' },
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    const url = new URL(request.url);
    const history = url.searchParams.get('history');

    if (history === 'true') {
      const results = await db.prepare('SELECT * FROM telemetry ORDER BY id DESC LIMIT 50').all();
      return new Response(JSON.stringify({ history: results.results }), { headers: { 'Content-Type': 'application/json' } });
    }

    const baseUrl = url.origin;
    const checks = await Promise.all(ENDPOINTS.map(async (ep) => {
      const start = Date.now();
      try {
        const res = await fetch(baseUrl + ep.path, { method: 'GET' });
        const ms = Date.now() - start;
        const healthy = res.status >= 200 && res.status < 400 ? 1 : 0;
        await db.prepare('INSERT INTO telemetry (endpoint_name, path, status_code, response_ms, healthy) VALUES (?, ?, ?, ?, ?)')
          .bind(ep.name, ep.path, res.status, ms, healthy).run();
        return { name: ep.name, path: ep.path, status: res.status, ms, healthy };
      } catch (e: any) {
        const ms = Date.now() - start;
        await db.prepare('INSERT INTO telemetry (endpoint_name, path, status_code, response_ms, healthy) VALUES (?, ?, ?, ?, ?)')
          .bind(ep.name, ep.path, 0, ms, 0).run();
        return { name: ep.name, path: ep.path, status: 0, ms, healthy: 0, error: e.message };
      }
    }));

    const healthy = checks.filter(c => c.healthy).length;
    const avgMs = Math.round(checks.reduce((s, c) => s + c.ms, 0) / checks.length);

    return new Response(JSON.stringify({ checks, summary: { total: checks.length, healthy, issues: checks.length - healthy, avgMs } }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
