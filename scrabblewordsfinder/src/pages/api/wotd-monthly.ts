import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/wotd-monthly?month=2026-06
 * Returns all WOTD entries for the given month.
 * 
 * Query params:
 *   month: YYYY-MM format (defaults to current month)
 *   format: 'json' (default) or 'astro' (returns generated blog page content)
 */
export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  if (!db) return new Response(JSON.stringify({ error: 'DB not available' }), { status: 500 });

  const url = new URL(request.url);
  const monthParam = url.searchParams.get('month');
  const format = url.searchParams.get('format') || 'json';

  const now = new Date();
  const month = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return new Response(JSON.stringify({ error: 'Invalid month format. Use YYYY-MM.' }), { status: 400 });
  }

  const [year, mon] = month.split('-');
  const startDate = `${year}-${mon}-01`;
  const endDate = `${year}-${mon}-31`;

  const result = await db.prepare(
    'SELECT id, word, date, meaning, fun_fact FROM word_of_the_day WHERE date >= ? AND date <= ? ORDER BY date ASC'
  ).bind(startDate, endDate).all();

  const words = result.results || [];

  if (format === 'astro') {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[parseInt(mon) - 1];
    const slug = `wotd-${month}`;
    const title = `Word of the Day — ${monthName} ${year}`;
    const description = `All ${words.length} Words of the Day from ${monthName} ${year} on ScrabbleWordsFinder. Learn new Scrabble words and improve your vocabulary.`;

    const SCORES: Record<string, number> = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};
    const withMeaning = words.filter((w: any) => w.meaning && w.meaning.trim());
    const avgLength = words.length > 0 ? Math.round(words.reduce((sum: number, w: any) => sum + w.word.length, 0) / words.length * 10) / 10 : 0;
    const wordScores = words.map((w: any) => ({
      ...w,
      score: w.word.split('').reduce((s: number, c: string) => s + (SCORES[c] || 0), 0)
    }));
    const sorted = [...wordScores].sort((a: any, b: any) => b.score - a.score);
    const top5 = sorted.slice(0, 5);

    const wordRows = words.map((w: any, i: number) => {
      const dayNum = parseInt(w.date.split('-')[2]);
      const sc = w.word.split('').reduce((s: number, c: string) => s + (SCORES[c] || 0), 0);
      const bgClass = i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50';
      return `        <tr class="${bgClass}"><td class="px-4 py-3 font-mono text-xs text-gray-500">${dayNum}</td><td class="px-4 py-3 font-bold text-white tracking-wider">${w.word}</td><td class="px-4 py-3 text-amber-400 font-mono text-sm">${sc}</td><td class="px-4 py-3 text-sm text-gray-400 italic">${w.meaning || '\u2014'}</td></tr>`;
    }).join('\n');

    const top5Cards = top5.map((w: any) => {
      return `        <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20"><div class="flex items-center justify-between"><span class="text-lg font-black text-white tracking-wider">${w.word}</span><span class="text-amber-400 font-bold">${w.score} pts</span></div>${w.meaning ? `<p class="text-xs text-gray-400 mt-1 italic">${w.meaning}</p>` : ''}</div>`;
    }).join('\n');

    const content = `---
export const prerender = true;
import BlogLayout from '../../layouts/BlogLayout.astro';
import '../../styles/global.css';
---

<BlogLayout
  title="${title} \u2014 ScrabbleWordsFinder"
  description="${description}"
  keywords="word of the day ${monthName.toLowerCase()} ${year}, scrabble vocabulary, daily word, wotd ${month}"
>
  <script type="application/ld+json" set:html={JSON.stringify({"@context":"https://schema.org","@type":"Article","headline":"${title}","description":"${description}","datePublished":"${year}-${mon}-01","author":{"@type":"Organization","name":"ScrabbleWordsFinder.com","url":"https://www.scrabblewordsfinder.com"},"publisher":{"@type":"Organization","name":"ScrabbleWordsFinder.com"},"mainEntityOfPage":{"@type":"WebPage","@id":"https://www.scrabblewordsfinder.com/blog/${slug}"}})} />

  <script type="application/ld+json" set:html={JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What was the Word of the Day for ${monthName} ${year}?","acceptedAnswer":{"@type":"Answer","text":"ScrabbleWordsFinder featured ${words.length} words in ${monthName} ${year}, including ${words.slice(0, 5).map((w: any) => w.word).join(', ')}."}},{"@type":"Question","name":"How are Words of the Day chosen?","acceptedAnswer":{"@type":"Answer","text":"Words are selected from the official SOWPODS Scrabble dictionary, prioritising vocabulary that helps players learn new valid words."}},{"@type":"Question","name":"Can I use these words in Scrabble?","acceptedAnswer":{"@type":"Answer","text":"Yes! Every Word of the Day is a valid Scrabble word in the SOWPODS dictionary used internationally."}}]})} />

  <div class="max-w-3xl mx-auto px-4 py-12">
    <article class="prose prose-invert prose-gray max-w-none">
      <nav class="text-sm text-gray-400 mb-6 not-prose flex items-center gap-1">
        <a href="/blog" class="hover:text-blue-400 transition-colors">\u2190 Blog</a>
        <span class="mx-1">\u203A</span>
        <span class="text-gray-300">Word of the Day</span>
      </nav>

      <h1 class="text-3xl font-bold text-white mb-4">${title}</h1>

      <div class="not-prose mb-8 flex items-center gap-3 text-sm text-gray-400">
        <time datetime="${year}-${mon}-01">${monthName} ${year}</time>
        <span class="w-1 h-1 rounded-full bg-gray-600"></span>
        <span>${words.length} words</span>
        <span class="w-1 h-1 rounded-full bg-gray-600"></span>
        <a href="/activities/" class="inline-flex items-center gap-1 text-blue-400 hover:underline"><span aria-hidden="true">\uD83C\uDFAF</span> Activities</a>
      </div>

      <p class="text-lg leading-relaxed text-gray-300 mb-8">Every day in ${monthName} ${year}, ScrabbleWordsFinder featured a new vocabulary-building word. Here's the complete collection \u2014 ${words.length} words to add to your Scrabble arsenal.</p>

      <div class="not-prose my-6 p-4 rounded-xl border border-amber-500/30 bg-amber-950/10">
        <div class="flex flex-wrap items-center justify-center gap-6 text-center">
          <div><p class="text-xl font-bold text-amber-400">${words.length}</p><p class="text-xs text-gray-400">Words</p></div>
          <div><p class="text-xl font-bold text-amber-400">${avgLength}</p><p class="text-xs text-gray-400">Avg Length</p></div>
          <div><p class="text-xl font-bold text-amber-400">${withMeaning.length}</p><p class="text-xs text-gray-400">With Meanings</p></div>
          <div><p class="text-xl font-bold text-amber-400">${top5[0]?.score || 0}</p><p class="text-xs text-gray-400">Highest Score</p></div>
        </div>
      </div>

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Top Scoring Words</h2>
      <div class="not-prose my-6 grid grid-cols-1 gap-3">
${top5Cards}
      </div>

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">Complete Word List</h2>
      <div class="overflow-x-auto not-prose my-6">
        <table class="w-full text-sm border border-gray-700 rounded-lg overflow-hidden">
          <thead class="bg-gray-800"><tr><th class="px-4 py-3 text-left font-semibold text-gray-300">Day</th><th class="px-4 py-3 text-left font-semibold text-gray-300">Word</th><th class="px-4 py-3 text-left font-semibold text-gray-300">Score</th><th class="px-4 py-3 text-left font-semibold text-gray-300">Meaning</th></tr></thead>
          <tbody class="divide-y divide-gray-800">
${wordRows}
          </tbody>
        </table>
      </div>

      <h2 class="text-xl font-light text-blue-400 mt-10 mb-4 border-l-4 border-blue-400 pl-4">How to Use These Words</h2>
      <div class="not-prose my-6 grid grid-cols-1 gap-4">
        <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20"><p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Practice with the Solver:</span> Enter any word in our free word finder to see scoring combinations.</p></div>
        <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20"><p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Save to WordBench:</span> Add words to your Memory WordBench for flashcard practice.</p></div>
        <div class="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20"><p class="text-sm text-gray-300"><span class="text-purple-400 font-semibold">Test Yourself:</span> Use the Word Quiz to match words to meanings under time pressure.</p></div>
      </div>

      <aside class="border-t border-gray-800 mt-12 pt-8 not-prose">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Related</h3>
        <div class="grid gap-3">
          <a href="/activities/" class="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-blue-700 hover:bg-blue-900/10 transition-all group"><span class="text-blue-500 group-hover:translate-x-0.5 transition-transform">\u2192</span><span class="text-sm text-gray-300 group-hover:text-blue-400 transition-colors">Activities \u2014 Word of the Day, Quiz & More</span></a>
          <a href="/blog/beginner-scrabble-strategy" class="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-blue-700 hover:bg-blue-900/10 transition-all group"><span class="text-blue-500 group-hover:translate-x-0.5 transition-transform">\u2192</span><span class="text-sm text-gray-300 group-hover:text-blue-400 transition-colors">Beginner Scrabble Strategy</span></a>
        </div>
      </aside>

      <div class="not-prose mt-10 p-5 bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-800 rounded-xl">
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <p class="text-sm text-blue-300 font-medium">\uD83D\uDCD6 Get today's Word of the Day</p>
          <a href="/activities/" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-gray-950 text-sm font-semibold transition-colors">Open Activities \u2192</a>
        </div>
      </div>

      <div class="not-prose mt-8 text-center">
        <a href="/blog" class="text-sm text-gray-400 hover:text-blue-400 transition-colors">\u2190 Back to all articles</a>
      </div>
    </article>
  </div>
</BlogLayout>`;

    return new Response(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  return new Response(JSON.stringify({ month, count: words.length, words }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
