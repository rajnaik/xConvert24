import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * GET /api/breaking-news?disease=covid&refresh=true
 * 
 * Returns the top 5 latest news items for the given disease from ContagionNews table.
 * 
 * When refresh=true:
 *   1. Queries the Contagion table for all active contagions
 *   2. For each contagion, searches Tavily for 5 top news articles
 *   3. Clears old ContagionNews entries and inserts fresh results
 *   4. Returns the news for the requested disease
 * 
 * When refresh is omitted/false:
 *   Returns cached news from the ContagionNews table for the requested disease.
 */
export const GET: APIRoute = async ({ url }) => {
  const disease = url.searchParams.get('disease') || 'covid';
  const refresh = url.searchParams.get('refresh') === 'true';
  const db = (env as any).BUGS_DB;
  const tavilyKey = (env as any).TAVILY_API_KEY || '';

  // Map disease slug to ConName in the database
  const diseaseToConName: Record<string, string> = {
    covid: 'COVID-19',
    ebola: 'EBOLA',
    hantavirus: 'HANTAVIRUS',
  };

  // If refresh requested, fetch fresh news from Tavily for ALL contagions
  if (refresh && tavilyKey && db) {
    try {
      // Get all active contagions
      const contagions = await db.prepare(
        'SELECT ConID, ConName, ConVariant FROM Contagion WHERE Status = 1'
      ).all();

      const rows = contagions.results || [];

      // Get preferred sources per contagion from ContagionSources table
      const sourcesResult = await db.prepare(
        'SELECT ConID, SourceDomain FROM ContagionSources WHERE Status = 1 ORDER BY Priority ASC'
      ).all();
      const sourceRows = sourcesResult.results || [];

      // Group source domains by ConID
      const sourcesByConId: Record<number, string[]> = {};
      for (const src of sourceRows) {
        const conId = (src as any).ConID;
        if (!sourcesByConId[conId]) sourcesByConId[conId] = [];
        sourcesByConId[conId].push((src as any).SourceDomain);
      }

      // Build Tavily search queries per contagion
      const searchQueries: Record<number, { query: string; domains: string[] }> = {};
      for (const row of rows) {
        const name = (row as any).ConName;
        const variant = (row as any).ConVariant;
        const conId = (row as any).ConID;
        searchQueries[conId] = {
          query: `${name} ${variant} latest news outbreak 2026`,
          domains: sourcesByConId[conId] || [],
        };
      }

      // Search Tavily for each contagion (5 results each), targeting preferred sources
      const allNews: Array<{ conId: number; title: string; url: string; publishedDate: string; source: string; snippet: string }> = [];

      await Promise.all(
        Object.entries(searchQueries).map(async ([conIdStr, { query, domains }]) => {
          const conId = parseInt(conIdStr);
          try {
            const body: any = {
              api_key: tavilyKey,
              query,
              search_depth: 'basic',
              include_answer: false,
              max_results: 5,
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

            if (!response.ok) return;

            const data = await response.json();
            const results = (data.results || []).slice(0, 5);

            for (const r of results) {
              allNews.push({
                conId,
                title: (r.title || 'Untitled').slice(0, 200),
                url: r.url || '',
                publishedDate: r.published_date || '',
                source: extractDomain(r.url || ''),
                snippet: (r.content || '').slice(0, 300),
              });
            }
          } catch {
            // Skip this contagion if Tavily fails for it
          }
        })
      );

      // Clear old news and insert fresh results in a batch
      if (allNews.length > 0) {
        await db.prepare('DELETE FROM ContagionNews').run();

        // Insert in batches (D1 supports batch)
        const stmts = allNews.map((item) =>
          db.prepare(
            'INSERT INTO ContagionNews (ConID, CN_Name, NewsURL, Snippet, Source, PublishedDate) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(item.conId, item.title, item.url, item.snippet || '', item.source || '', item.publishedDate || '')
        );
        await db.batch(stmts);
      }

      // Return fresh results directly with publishedDate and source
      const conName = diseaseToConName[disease] || diseaseToConName.covid;
      const contagionRow = rows.find((r: any) => r.ConName === conName);
      const conId = contagionRow ? (contagionRow as any).ConID : null;
      const freshNews = conId
        ? allNews.filter((item) => item.conId === conId).slice(0, 5)
        : allNews.slice(0, 5);

      return new Response(JSON.stringify({
        news: freshNews.map((item) => ({
          title: item.title,
          snippet: item.snippet || '',
          url: item.url,
          publishedDate: item.publishedDate,
          source: item.source,
          dateCreated: new Date().toISOString(),
        })),
        source: 'tavily',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      });
    } catch {
      // If refresh fails, fall through to return cached data
    }
  }

  // Return news for the requested disease from DB
  if (db) {
    try {
      const conName = diseaseToConName[disease] || diseaseToConName.covid;
      const result = await db.prepare(`
        SELECT cn.CN_ID, cn.CN_Name, cn.NewsURL, cn.FetchTime, cn.Snippet, cn.Source, cn.PublishedDate
        FROM ContagionNews cn
        JOIN Contagion c ON cn.ConID = c.ConID
        WHERE c.ConName = ? AND cn.Status = 1
        ORDER BY cn.CN_ID DESC
        LIMIT 5
      `).bind(conName).all();

      const rows = result.results || [];
      const news = rows.map((r: any) => ({
        title: r.CN_Name,
        snippet: r.Snippet || '',
        url: r.NewsURL,
        publishedDate: r.PublishedDate || r.FetchTime,
        source: r.Source || '',
        dateCreated: r.FetchTime,
      }));

      return new Response(JSON.stringify({
        news,
        source: refresh ? 'tavily' : 'cached',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      });
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback if DB not available
  return new Response(JSON.stringify({
    news: getFallbackNews(disease),
    source: 'fallback',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
};

function getFallbackNews(disease: string) {
  const fallbacks: Record<string, Array<{ title: string; snippet: string; url: string }>> = {
    covid: [
      { title: 'WHO continues monitoring COVID-19 variants globally', snippet: 'The World Health Organization maintains surveillance of emerging SARS-CoV-2 variants as the virus enters its endemic phase.', url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019' },
      { title: 'Updated COVID vaccines target latest circulating strains', snippet: 'Health authorities recommend updated booster shots targeting the most recent variants for at-risk populations.', url: 'https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-(covid-19)-vaccines' },
      { title: 'Long COVID research advances with new treatment trials', snippet: 'Clinical trials for Long COVID treatments show promising results as researchers better understand post-infection syndrome.', url: 'https://www.nih.gov/research-training/medical-research-initiatives/long-covid' },
    ],
    ebola: [
      { title: 'WHO declares Bundibugyo Ebola outbreak a PHEIC — DRC & Uganda', snippet: 'On 17 May 2026, WHO determined the Ebola disease caused by Bundibugyo virus in DRC and Uganda constitutes a public health emergency of international concern.', url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON603' },
      { title: 'CDC reports confirmed cases and deaths from Bundibugyo Ebola', snippet: 'Confirmed cases and deaths have been reported in DRC and Uganda. No cases reported in the United States.', url: 'https://www.cdc.gov/mmwr/volumes/75/wr/mm7522e3.htm' },
      { title: 'DR Congo Ebola: Nurses discharged after full recovery', snippet: 'First confirmed survivor recoveries as UN-partnered response ramps up. No licensed vaccine or treatment exists for Bundibugyo species.', url: 'https://news.un.org/en/story/2026/06/1167613' },
    ],
    hantavirus: [
      { title: 'Hantavirus cluster linked to cruise ship travel', snippet: 'WHO monitoring multi-country hantavirus cluster linked to MV Hondius cruise ship.', url: 'https://www.who.int/emergencies/disease-outbreak-news/item/2026-DON601' },
      { title: 'Arizona Resident Dies Of Hantavirus Sin Nombre Variant', snippet: 'An Arizona resident has died from hantavirus Sin Nombre strain, officials confirmed.', url: 'https://www.forbes.com/sites/maryroeloffs/2026/06/03/arizona-resident-dies-of-hantavirus-variant-just-as-deadly-as-cruise-ship-strain/' },
      { title: 'CDC provides update on hantavirus outbreak', snippet: 'CDC updates guidance on the multi-country hantavirus cluster.', url: 'https://www.cdc.gov/han/php/notices/han00528.html' },
    ],
  };
  return fallbacks[disease] || fallbacks.covid;
}
