import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

/**
 * GET /api/breaking-news?disease=covid
 * Returns the top 3 latest news items for the given disease.
 * Uses Tavily search API for real-time news results.
 */
export const GET: APIRoute = async ({ url }) => {
  const disease = url.searchParams.get('disease') || 'covid';

  const diseaseQueries: Record<string, string> = {
    covid: 'COVID-19 latest news outbreak 2025 2026',
    ebola: 'Ebola virus outbreak latest news 2025 2026',
    hantavirus: 'Hantavirus cases latest news 2025 2026',
  };

  const query = diseaseQueries[disease] || diseaseQueries.covid;

  try {
    // Use Tavily search API — secret stored via wrangler secret
    const tavilyKey = (env as any).TAVILY_API_KEY || '';

    if (!tavilyKey) {
      // Return fallback news if no API key
      return new Response(JSON.stringify({
        news: getFallbackNews(disease),
        source: 'fallback',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      });
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query,
        search_depth: 'basic',
        include_answer: false,
        max_results: 3,
        topic: 'news',
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();
    const results = (data.results || []).slice(0, 3);

    const news = results.map((r: any) => ({
      title: r.title || 'Untitled',
      snippet: r.content?.slice(0, 150) || '',
      url: r.url || '#',
      publishedDate: r.published_date || null,
    }));

    return new Response(JSON.stringify({
      news,
      source: 'tavily',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({
      news: getFallbackNews(disease),
      source: 'fallback',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  }
};

function getFallbackNews(disease: string) {
  const fallbacks: Record<string, Array<{ title: string; snippet: string; url: string }>> = {
    covid: [
      { title: 'WHO continues monitoring COVID-19 variants globally', snippet: 'The World Health Organization maintains surveillance of emerging SARS-CoV-2 variants as the virus enters its endemic phase.', url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019' },
      { title: 'Updated COVID vaccines target latest circulating strains', snippet: 'Health authorities recommend updated booster shots targeting the most recent variants for at-risk populations.', url: 'https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-(covid-19)-vaccines' },
      { title: 'Long COVID research advances with new treatment trials', snippet: 'Clinical trials for Long COVID treatments show promising results as researchers better understand post-infection syndrome.', url: 'https://www.nih.gov/research-training/medical-research-initiatives/long-covid' },
    ],
    ebola: [
      { title: 'DRC maintains Ebola surveillance after 2024 outbreak', snippet: 'The Democratic Republic of Congo continues active surveillance following the Equateur province outbreak.', url: 'https://www.who.int/emergencies/disease-outbreak-news' },
      { title: 'Ebola vaccine deployment expanded in at-risk regions', snippet: 'Ring vaccination strategies using rVSV-ZEBOV continue in communities at risk of Ebola outbreaks.', url: 'https://www.who.int/news-room/fact-sheets/detail/ebola-virus-disease' },
      { title: 'New Ebola therapeutic candidates enter clinical trials', snippet: 'Research continues on monoclonal antibody treatments and antivirals targeting filoviruses.', url: 'https://www.nih.gov/research-training/medical-research-initiatives/ebola' },
    ],
    hantavirus: [
      { title: 'Seasonal hantavirus risk increases with rodent activity', snippet: 'Public health officials warn of increased exposure risk during warm months when rodent populations peak.', url: 'https://www.cdc.gov/hantavirus/' },
      { title: 'Hantavirus prevention: cleaning guidelines updated', snippet: 'CDC updates guidance on safe cleaning of rodent-infested areas to prevent aerosolized virus exposure.', url: 'https://www.cdc.gov/hantavirus/prevention/index.html' },
      { title: 'Global hantavirus surveillance reports steady case numbers', snippet: 'Annual global cases remain in the 150,000-200,000 range, primarily HFRS cases in East Asia.', url: 'https://www.who.int/health-topics/hantavirus' },
    ],
  };
  return fallbacks[disease] || fallbacks.covid;
}
