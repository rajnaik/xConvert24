import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /rss/news.xml — RSS feed for latest Scrabble news
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  let items = '';

  try {
    const { results } = await db.prepare(
      "SELECT title, summary, source_url, category, fetched_at FROM latest_news WHERE active = 1 AND approved = 1 ORDER BY fetched_at DESC LIMIT 20"
    ).all();

    items = (results || []).map((r: any) => `    <item>
      <title>${escXml(r.title)}</title>
      <description>${escXml(r.summary)}</description>
      <link>${escXml(r.source_url || 'https://www.scrabblewordsfinder.com/latest-news/')}</link>
      <category>${escXml(r.category)}</category>
      <pubDate>${new Date(r.fetched_at + 'Z').toUTCString()}</pubDate>
    </item>`).join('\n');
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ScrabbleWordsFinder — Latest News</title>
    <link>https://www.scrabblewordsfinder.com/latest-news/</link>
    <description>Latest Scrabble tournament results, player achievements, and community news.</description>
    <language>en</language>
    <atom:link href="https://www.scrabblewordsfinder.com/rss/news.xml" rel="self" type="application/rss+xml"/>
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
