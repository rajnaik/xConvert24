import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * POST /api/fetch-news/ — Manually trigger the news fetch (admin only)
 * Uses Workers AI to search for Scrabble news and store summaries.
 */

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = (env as any).DB;
  const ai = (env as any).AI;
  const tavilyKey = (env as any).TAVILY_API_KEY;
  if (!db) return jsonError('DB not configured', 500);
  if (!tavilyKey) return jsonError('TAVILY_API_KEY not configured', 500);

  try {
    // Accept optional overrides from POST body
    let body: any = {};
    try { body = await request.json(); } catch {}

    // Rotate queries (or use override)
    const queries = [
      'competitive scrabble tournament results 2026',
      'WESPA scrabble news',
      'NASPA scrabble tournament winners 2026',
      'world scrabble championship news',
      'scrabble community news events 2026',
      'international scrabble tournament results',
      'scrabble player achievements 2026',
    ];
    const dayOfWeek = new Date().getDay();
    const query = body.query || queries[dayOfWeek % queries.length];
    const days = body.days || 30;

    // Step 1: Search with Tavily
    const searchRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'basic',
        max_results: 8,
        days,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!searchRes.ok) {
      return json({ success: false, error: `Tavily search failed: ${searchRes.status}` }, 500);
    }

    const searchData: any = await searchRes.json();
    const rawResults = searchData.results || [];

    // Filter out generic topic/tag/category pages — only keep actual articles
    const results = rawResults.filter((r: any) => {
      const url = r.url || '';
      // Reject URLs that are topic/tag aggregate pages
      if (/\/topic\/|\/tag\/|\/tags\/|\/category\/|\/categories\/|\/search\?/.test(url)) return false;
      // Reject URLs that end in just a domain or a single path segment with no article slug
      const path = new URL(url).pathname;
      if (path === '/' || path === '') return false;
      // Reject very short paths (likely homepages or section pages)
      if (path.split('/').filter(Boolean).length < 2 && !path.includes('-')) return false;
      return true;
    });

    if (results.length === 0) {
      return json({ success: true, inserted: 0, message: 'No article-level results after filtering', query, days, filtered_out: rawResults.length });
    }

    // Step 2: Build news items directly from Tavily results + optional AI summary
    let newsItems: any[] = [];

    // Always build items from raw Tavily results first (guaranteed real URLs + dates)
    const rawItems = results.slice(0, 5).map((r: any) => ({
      title: (r.title || '').slice(0, 80),
      summary: (r.content || '').slice(0, 300),
      source_url: r.url || '',
      source_name: (() => { try { return new URL(r.url || '').hostname.replace('www.', ''); } catch { return ''; } })(),
      category: 'general',
      published_date: r.published_date ? r.published_date.split('T')[0] : '',
    }));

    // Optionally use AI to improve summaries (but keep URLs and dates from Tavily)
    if (ai) {
      try {
        const snippets = results.slice(0, 5).map((r: any, i: number) =>
          `${i + 1}. "${r.title}" — ${r.content?.slice(0, 200) || ''}`
        ).join('\n');

        const response = await ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', {
          messages: [
            { role: 'system', content: 'You improve news summaries. For each numbered item, write a better 2-sentence summary. Return a JSON array of strings (one summary per item). JSON only, no markdown.' },
            { role: 'user', content: `Improve these Scrabble news summaries:\n${snippets}\n\nReturn JSON array of 2-sentence summaries, e.g. ["summary1", "summary2", ...]` }
          ],
          max_tokens: 1000,
        });

        const text = response?.response || '';
        try {
          const summaries = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          if (Array.isArray(summaries)) {
            summaries.forEach((s: string, i: number) => {
              if (i < rawItems.length && typeof s === 'string' && s.length > 20) {
                rawItems[i].summary = s.slice(0, 300);
              }
            });
          }
        } catch { /* keep raw summaries */ }
      } catch { /* AI failed, use raw summaries */ }
    }

    // Categorise based on keywords
    for (const item of rawItems) {
      const lower = (item.title + ' ' + item.summary).toLowerCase();
      if (lower.includes('tournament') || lower.includes('championship') || lower.includes('won') || lower.includes('winner')) {
        item.category = 'tournament';
      } else if (lower.includes('player') || lower.includes('champion') || lower.includes('ranked')) {
        item.category = 'player';
      } else if (lower.includes('rule') || lower.includes('dictionary') || lower.includes('word list')) {
        item.category = 'rules';
      } else if (lower.includes('club') || lower.includes('community') || lower.includes('youth')) {
        item.category = 'community';
      }
    }

    newsItems = rawItems;

    // Step 3: Deduplicate
    const existingTitles = await db.prepare(
      "SELECT title FROM latest_news WHERE fetched_at > datetime('now', '-7 days')"
    ).all();
    const existing = new Set((existingTitles.results || []).map((r: any) => r.title.toLowerCase()));

    let inserted = 0;
    for (const item of newsItems.slice(0, 5)) {
      if (!item.title || !item.summary) continue;
      if (existing.has(item.title.toLowerCase())) continue;

      await db.prepare(
        `INSERT INTO latest_news (title, summary, source_url, source_name, category, published_date)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        item.title.slice(0, 200),
        item.summary.slice(0, 500),
        item.source_url || '',
        item.source_name || '',
        ['tournament', 'player', 'rules', 'community', 'general'].includes(item.category) ? item.category : 'general',
        item.published_date || ''
      ).run();
      inserted++;
    }

    // Update last fetch time
    await db.prepare("UPDATE site_status SET last_news_fetch = datetime('now') WHERE id = 1").run();

    return json({ success: true, inserted, total_found: newsItems.length, query, days, source: 'tavily' });
  } catch (e: any) {
    return json({ success: false, error: e.message }, 500);
  }
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
