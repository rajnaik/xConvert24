import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /rss/tournaments.xml — RSS feed for tournament calendar
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  let items = '';

  try {
    const { results } = await db.prepare(
      "SELECT name, location, country, start_date, end_date, tier, status, winner FROM tournaments ORDER BY start_date DESC LIMIT 20"
    ).all();

    items = (results || []).map((r: any) => `    <item>
      <title>${escXml(r.name)} — ${r.location}, ${r.country}</title>
      <description>${r.tier.toUpperCase()} tier event. ${r.start_date} to ${r.end_date}. Status: ${r.status}.${r.winner ? ' Winner: ' + escXml(r.winner) : ''}</description>
      <link>https://www.scrabblewordsfinder.com/world-rankings/</link>
      <category>${r.tier}</category>
      <pubDate>${new Date(r.start_date + 'T00:00:00Z').toUTCString()}</pubDate>
    </item>`).join('\n');
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ScrabbleWordsFinder — Tournament Calendar</title>
    <link>https://www.scrabblewordsfinder.com/world-rankings/</link>
    <description>WESPA-rated Scrabble tournaments worldwide — upcoming events and recent results.</description>
    <language>en</language>
    <atom:link href="https://www.scrabblewordsfinder.com/rss/tournaments.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
};

function escXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
