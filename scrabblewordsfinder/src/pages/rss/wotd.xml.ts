import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /rss/wotd.xml — RSS feed for Word of the Day
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  let items = '';

  try {
    const { results } = await db.prepare(
      "SELECT word, meaning, fun_fact, date FROM word_of_the_day WHERE date <= date('now') ORDER BY date DESC LIMIT 14"
    ).all();

    items = (results || []).map((r: any) => `    <item>
      <title>${escXml(r.word)} — Word of the Day</title>
      <description>${escXml(r.meaning || '')}${r.fun_fact ? ' ' + escXml(r.fun_fact) : ''}</description>
      <link>https://www.scrabblewordsfinder.com/activities/#wotd</link>
      <guid>wotd-${r.date}</guid>
      <pubDate>${new Date(r.date + 'T00:00:00Z').toUTCString()}</pubDate>
    </item>`).join('\n');
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ScrabbleWordsFinder — Word of the Day</title>
    <link>https://www.scrabblewordsfinder.com/activities/#wotd</link>
    <description>Daily vocabulary word with meaning and fun facts. Expand your Scrabble word knowledge one day at a time.</description>
    <language>en</language>
    <atom:link href="https://www.scrabblewordsfinder.com/rss/wotd.xml" rel="self" type="application/rss+xml"/>
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
