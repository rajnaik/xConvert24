import type { APIRoute } from 'astro';

export const prerender = true;

const pages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/blog/scrabble-history-origins-great-depression', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/scrabble-tile-strategy-letters-scoring', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/scrabble-dictionaries-languages-weird-words', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/competitive-scrabble-tournament-world', priority: '0.7', changefreq: 'monthly' },
  { url: '/guide', priority: '0.6', changefreq: 'monthly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/contact', priority: '0.4', changefreq: 'yearly' },
  { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/suggest', priority: '0.4', changefreq: 'monthly' },
  { url: '/settings', priority: '0.4', changefreq: 'yearly' },
];

export const GET: APIRoute = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>https://www.scrabblewordsfinder.com${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
