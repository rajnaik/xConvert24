import type { APIRoute } from 'astro';

export const prerender = true;

const pages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  { url: '/guide', priority: '0.7', changefreq: 'monthly' },
  { url: '/faq', priority: '0.6', changefreq: 'monthly' },
  { url: '/achievements', priority: '0.6', changefreq: 'weekly' },
  { url: '/tech-stack', priority: '0.5', changefreq: 'monthly' },
  { url: '/releases', priority: '0.5', changefreq: 'weekly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/suggest', priority: '0.4', changefreq: 'monthly' },
  { url: '/contact', priority: '0.4', changefreq: 'yearly' },
  { url: '/settings', priority: '0.4', changefreq: 'yearly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  // Blog - Category landing pages
  { url: '/blog/beginner-guides', priority: '0.7', changefreq: 'weekly' },
  { url: '/blog/two-letter-words', priority: '0.7', changefreq: 'weekly' },
  { url: '/blog/three-letter-words', priority: '0.7', changefreq: 'weekly' },
  // Blog - Strategy & History
  { url: '/blog/scrabble-history-origins-great-depression', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/scrabble-tile-strategy-letters-scoring', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/scrabble-dictionaries-languages-weird-words', priority: '0.7', changefreq: 'monthly' },
  { url: '/blog/competitive-scrabble-tournament-world', priority: '0.7', changefreq: 'monthly' },
  // Blog - Beginner Guides
  { url: '/blog/what-is-scrabble', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/how-to-play-scrabble', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/scrabble-rules-explained', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/beginner-scrabble-strategy', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/how-to-win-scrabble', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/common-scrabble-mistakes', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/scrabble-scoring-guide', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/understanding-premium-squares', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/how-blank-tiles-work', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/scrabble-etiquette', priority: '0.6', changefreq: 'monthly' },
  // Blog - Two-Letter Words
  { url: '/blog/best-two-letter-words-scrabble', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/two-letter-scrabble-words-complete-list', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/most-useful-two-letter-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/memorizing-two-letter-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/rare-two-letter-scrabble-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/two-letter-words-by-alphabet', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/printable-two-letter-word-list', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/two-letter-words-with-q', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/two-letter-words-with-x', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/two-letter-words-with-z', priority: '0.6', changefreq: 'monthly' },
  // Blog - Three-Letter Words
  { url: '/blog/best-three-letter-scrabble-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/common-three-letter-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/easy-three-letter-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/highest-scoring-three-letter-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/overlooked-three-letter-words', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/three-letter-word-strategy', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/three-letter-words-for-beginners', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/three-letter-words-with-q', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/three-letter-words-with-z', priority: '0.6', changefreq: 'monthly' },
  { url: '/blog/printable-three-letter-list', priority: '0.6', changefreq: 'monthly' },
  // Blog - Words Starting With (A-Z)
  ...Array.from({ length: 26 }, (_, i) => ({ url: `/blog/words-starting-with-${String.fromCharCode(97 + i)}`, priority: '0.5', changefreq: 'monthly' as const })),
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
