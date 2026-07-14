import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /rss/rankings.xml — RSS feed for world rankings updates
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  let items = '';

  try {
    const { results } = await db.prepare(
      "SELECT rank, name, country, rating, ranking_type, last_updated FROM player_rankings WHERE ranking_type = 'wespa' AND active = 1 ORDER BY rank ASC LIMIT 25"
    ).all();

    items = (results || []).map((r: any) => `    <item>
      <title>#${r.rank} ${escXml(r.name)} (${r.country}) — Rating: ${r.rating}</title>
      <description>World rank #${r.rank}: ${escXml(r.name)} from ${r.country} with WESPA rating ${r.rating}.</description>
      <link>https://www.scrabblewordsfinder.com/world-rankings/</link>
      <pubDate>${new Date(r.last_updated + 'Z').toUTCString()}</pubDate>
    </item>`).join('\n');
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ScrabbleWordsFinder — World Rankings</title>
    <link>https://www.scrabblewordsfinder.com/world-rankings/</link>
    <description>WESPA World Scrabble Rankings — top 25 players updated regularly.</description>
    <language>en</language>
    <atom:link href="https://www.scrabblewordsfinder.com/rss/rankings.xml" rel="self" type="application/rss+xml"/>
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
