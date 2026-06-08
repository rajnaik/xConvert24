import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/cron/refresh-news
 * 
 * Called by Cloudflare Cron Trigger every hour to refresh breaking news via Tavily.
 * Fetches fresh news for all active contagions and updates the ContagionNews table.
 * Uses ContagionSources to target preferred domains per disease for higher quality results.
 * 
 * Protected by a simple shared secret to prevent public abuse.
 */
export const GET: APIRoute = async ({ request }) => {
  const db = (env as any).BUGS_DB;
  const tavilyKey = (env as any).TAVILY_API_KEY || '';
  const cronSecret = (env as any).CRON_SECRET || '';

  // Verify cron secret (Cloudflare cron triggers can pass via header or we allow internal calls)
  const authHeader = request.headers.get('x-cron-secret') || '';
  const isCronTrigger = request.headers.get('cf-worker') !== null; // Internal fetch from scheduled handler
  
  if (!isCronTrigger && authHeader !== cronSecret && cronSecret !== '') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!tavilyKey || !db) {
    return new Response(JSON.stringify({ error: 'Missing Tavily key or DB binding' }), { status: 500 });
  }

  try {
    // Get all active contagions
    const contagions = await db.prepare(
      `SELECT ConID, ConName, ConVariant FROM Contagion WHERE Status = 1`
    ).all();
    const rows = contagions.results || [];

    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'No active contagions' }), { status: 200 });
    }

    // Get preferred sources per contagion from ContagionSources table
    const sourcesResult = await db.prepare(
      'SELECT ConID, SourceDomain FROM ContagionSources WHERE Status = 1 ORDER BY Priority ASC'
    ).all();
    const sourceRows = sourcesResult.results || [];

    // Build domain lookup: { conId: ['who.int', 'cdc.gov', ...] }
    const domainsByConId: Record<number, string[]> = {};
    for (const src of sourceRows as any[]) {
      if (!domainsByConId[src.ConID]) domainsByConId[src.ConID] = [];
      domainsByConId[src.ConID].push(src.SourceDomain);
    }

    // Search Tavily for each contagion, targeting preferred sources
    const allNews: Array<{ conId: number; title: string; url: string; publishedDate: string; source: string; snippet: string }> = [];

    await Promise.all(
      rows.map(async (row: any) => {
        const query = `${row.ConName} outbreak latest news 2026`;
        const domains = domainsByConId[row.ConID] || [];
        try {
          const body: any = {
            api_key: tavilyKey,
            query,
            search_depth: 'basic',
            max_results: 5,
            include_answer: false,
            topic: 'news',
          };
          // If we have preferred domains, tell Tavily to search them
          if (domains.length > 0) {
            body.include_domains = domains;
          }

          const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (response.ok) {
            const data: any = await response.json();
            const results = data.results || [];
            for (const r of results) {
              allNews.push({
                conId: row.ConID,
                title: r.title || '',
                url: r.url || '',
                publishedDate: r.published_date || '',
                source: extractDomain(r.url || ''),
                snippet: (r.content || '').slice(0, 300),
              });
            }
          }
        } catch {
          // Skip failed contagion
        }
      })
    );

    // Clear old news and insert fresh
    await db.prepare(`DELETE FROM ContagionNews`).run();

    if (allNews.length > 0) {
      const stmts = allNews.map((n) =>
        db.prepare(
          'INSERT INTO ContagionNews (ConID, CN_Name, NewsURL, Snippet, Source, PublishedDate) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(n.conId, n.title, n.url, n.snippet, n.source, n.publishedDate)
      );
      await db.batch(stmts);
    }

    return new Response(JSON.stringify({
      message: `Refreshed ${allNews.length} news items for ${rows.length} contagions`,
      sourcesUsed: Object.fromEntries(
        Object.entries(domainsByConId).map(([k, v]) => [k, v.length])
      ),
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Cron refresh failed' }), { status: 500 });
  }
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}
