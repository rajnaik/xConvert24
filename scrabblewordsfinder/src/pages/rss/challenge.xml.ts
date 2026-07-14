import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /rss/challenge.xml — RSS feed for Daily Challenges (rack + anagram)
 */
export const prerender = false;

export const GET: APIRoute = async () => {
  const db = (env as any).DB;
  let items = '';

  try {
    const { results } = await db.prepare(
      "SELECT r.date, r.rack, r.best_word, r.best_score, a.scrambled, a.hint, a.word_length FROM daily_rack r LEFT JOIN daily_anagram a ON r.date = a.date WHERE r.date <= date('now') ORDER BY r.date DESC LIMIT 14"
    ).all();

    items = (results || []).map((r: any) => `    <item>
      <title>Daily Challenge — ${r.date}</title>
      <description>Rack: ${escXml(r.rack || '')} (Best: ${escXml(r.best_word || '?')} for ${r.best_score || 0} pts). Anagram: ${escXml(r.scrambled || '')} (${r.word_length || '?'} letters, hint: ${escXml(r.hint || '')}).</description>
      <link>https://www.scrabblewordsfinder.com/activities/</link>
      <guid>challenge-${r.date}</guid>
      <pubDate>${new Date(r.date + 'T00:00:00Z').toUTCString()}</pubDate>
    </item>`).join('\n');
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ScrabbleWordsFinder — Daily Challenges</title>
    <link>https://www.scrabblewordsfinder.com/activities/</link>
    <description>Daily Scrabble challenges: rack puzzles and anagram scrambles. New challenge every day.</description>
    <language>en</language>
    <atom:link href="https://www.scrabblewordsfinder.com/rss/challenge.xml" rel="self" type="application/rss+xml"/>
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
